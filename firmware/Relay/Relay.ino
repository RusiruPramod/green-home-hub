#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"
#include <DHT.h>

// ======================
// WiFi Credentials
// ======================
#define WIFI_SSID "ESP32"
#define WIFI_PASSWORD "12345678"

// ======================
// Firebase Credentials
// ======================
#define API_KEY "AIzaSyCO7vsvUvYaLI11r9wjztYuMIteG4AorrY"
#define DATABASE_URL "https://esp32led-b6105-c0b99-default-rtdb.asia-southeast1.firebasedatabase.app/"

// ======================
// Relay Pins
// ======================
constexpr uint8_t RELAY_EXHAUST_FAN = 26; // Relay 1
constexpr uint8_t RELAY_PRESENCE = 14;    // Relay 2
constexpr uint8_t RELAY_LIGHTS = 13;      // Relay 3
constexpr uint8_t RELAY_PUMP = 5;         // Relay 4

// Change to false if your relay module is active LOW.
constexpr bool RELAY_ACTIVE_HIGH = true;

// ======================
// Firebase Paths
// ======================
const char *PATH_EXHAUST_FAN_CMD = "/devices/exhaustFan";
const char *PATH_MOTION_ENABLE = "/devices/motionDetection";
const char *PATH_LIGHTS_CMD = "/devices/lights";
const char *PATH_PUMP_CMD = "/devices/waterPump";

// Auto trigger inputs (boolean paths in Firebase)
const char *PATH_GAS_DETECTED = "/sensors/gasDetected";
const char *PATH_OCCUPANCY_DETECTED = "/sensors/occupancyDetected";

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

bool signupOK = false;

// Device command states from Firebase
bool cmdExhaustFan = false;
bool cmdMotionDetectionEnable = true;
bool cmdLights = false;
bool cmdWaterPump = false;

// Auto trigger states from Firebase
bool gasDetected = false;
bool occupancyDetected = false;

// Runtime relay states
bool relayExhaustFanOn = false;
bool relayPresenceOn = false;
bool relayLightsOn = false;
bool relayPumpOn = false;

// Auto-off handling
unsigned long lastGasDetectedMs = 0;
unsigned long lastOccupancyDetectedMs = 0;

constexpr unsigned long FIREBASE_POLL_MS = 500;
constexpr unsigned long GAS_AUTO_OFF_DELAY_MS = 15000;
constexpr unsigned long OCCUPANCY_AUTO_OFF_DELAY_MS = 20000;

unsigned long lastPollMs = 0;

void setRelay(uint8_t pin, bool on) {
	digitalWrite(pin, on == RELAY_ACTIVE_HIGH ? HIGH : LOW);
}

bool readBoolPath(const char *path, bool fallbackValue) {
	if (Firebase.RTDB.getBool(&fbdo, path)) {
		return fbdo.boolData();
	}

	Serial.print("Read failed: ");
	Serial.print(path);
	Serial.print(" | ");
	Serial.println(fbdo.errorReason());
	return fallbackValue;
}

void applyRelayOutputs() {
	setRelay(RELAY_EXHAUST_FAN, relayExhaustFanOn);
	setRelay(RELAY_PRESENCE, relayPresenceOn);
	setRelay(RELAY_LIGHTS, relayLightsOn);
	setRelay(RELAY_PUMP, relayPumpOn);
}

void updateControlLogic() {
	const unsigned long now = millis();

	if (gasDetected) {
		lastGasDetectedMs = now;
	}

	if (occupancyDetected) {
		lastOccupancyDetectedMs = now;
	}

	// Relay 1: Exhaust fan
	// Auto gas control has priority over manual command while gas is high.
	if (gasDetected) {
		relayExhaustFanOn = true;
	} else {
		const bool gasHoldActive = (now - lastGasDetectedMs) <= GAS_AUTO_OFF_DELAY_MS;
		relayExhaustFanOn = gasHoldActive ? true : cmdExhaustFan;
	}

	// Relay 2: Presence relay (auto only)
	// devices/motionDetection enables/disables occupancy auto behavior.
	if (!cmdMotionDetectionEnable) {
		relayPresenceOn = false;
	} else {
		const bool occupancyHoldActive = (now - lastOccupancyDetectedMs) <= OCCUPANCY_AUTO_OFF_DELAY_MS;
		relayPresenceOn = occupancyDetected || occupancyHoldActive;
	}

	// Relay 3: Lights (manual)
	relayLightsOn = cmdLights;

	// Relay 4: Pump (manual)
	relayPumpOn = cmdWaterPump;

	applyRelayOutputs();
}

void setup() {
	Serial.begin(115200);

	pinMode(RELAY_EXHAUST_FAN, OUTPUT);
	pinMode(RELAY_PRESENCE, OUTPUT);
	pinMode(RELAY_LIGHTS, OUTPUT);
	pinMode(RELAY_PUMP, OUTPUT);

	// Safe startup defaults
	relayExhaustFanOn = false;
	relayPresenceOn = false;
	relayLightsOn = false;
	relayPumpOn = false;
	applyRelayOutputs();

	WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
	Serial.print("Connecting to WiFi");
	while (WiFi.status() != WL_CONNECTED) {
		Serial.print(".");
		delay(300);
	}
	Serial.println();
	Serial.print("Connected. IP: ");
	Serial.println(WiFi.localIP());

	config.api_key = API_KEY;
	config.database_url = DATABASE_URL;
	config.token_status_callback = tokenStatusCallback;

	if (Firebase.signUp(&config, &auth, "", "")) {
		signupOK = true;
		Serial.println("Firebase signUp OK");
	} else {
		Serial.print("Firebase signUp failed: ");
		Serial.println(config.signer.signupError.message.c_str());
	}

	Firebase.begin(&config, &auth);
	Firebase.reconnectWiFi(true);
}

void loop() {
	if (!Firebase.ready() || !signupOK) {
		return;
	}

	const unsigned long now = millis();
	if ((now - lastPollMs) < FIREBASE_POLL_MS) {
		return;
	}
	lastPollMs = now;

	// Read manual commands
	cmdExhaustFan = readBoolPath(PATH_EXHAUST_FAN_CMD, cmdExhaustFan);
	cmdMotionDetectionEnable = readBoolPath(PATH_MOTION_ENABLE, cmdMotionDetectionEnable);
	cmdLights = readBoolPath(PATH_LIGHTS_CMD, cmdLights);
	cmdWaterPump = readBoolPath(PATH_PUMP_CMD, cmdWaterPump);

	// Read auto triggers
	gasDetected = readBoolPath(PATH_GAS_DETECTED, gasDetected);
	occupancyDetected = readBoolPath(PATH_OCCUPANCY_DETECTED, occupancyDetected);

	updateControlLogic();

	Serial.printf("[Relays] Exhaust:%d Presence:%d Lights:%d Pump:%d | gas:%d occ:%d motionAuto:%d\n",
								relayExhaustFanOn,
								relayPresenceOn,
								relayLightsOn,
								relayPumpOn,
								gasDetected,
								occupancyDetected,
								cmdMotionDetectionEnable);
}
