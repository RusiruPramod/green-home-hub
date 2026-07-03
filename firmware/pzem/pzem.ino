#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

// WiFi credentials
#define WIFI_SSID "ESP32"
#define WIFI_PASSWORD "12345678"

// Firebase credentials
#define API_KEY "AIzaSyCO7vsvUvYaLI11r9wjztYuMIteG4AorrY"
#define DATABASE_URL "https://esp32led-b6105-c0b99-default-rtdb.asia-southeast1.firebasedatabase.app/"

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

bool signupOK = false;
bool wifiConnected = false;

String propertyId = "property_001";
String roomId = "room_001";
String basePath;

float pzemVoltage = 216.0f;
float pzemCurrent = 0.0f;
float pzemPower = 4.41f;
float pzemEnergy = 0.0f;

float targetVoltageV = 216.0f;
float targetPowerW = 4.41f;

unsigned long lastPzemRead = 0;
unsigned long lastFirebaseUpload = 0;

const unsigned long PZEM_INTERVAL = 3000;
const unsigned long FIREBASE_INTERVAL = 3000;

void updatePzemDummyReading() {
	if (millis() - lastPzemRead < PZEM_INTERVAL) {
		return;
	}

	lastPzemRead = millis();

	float smoothWave = (sin(millis() * 0.00012f) + 1.0f) * 0.5f;

	targetVoltageV = 216.0f + (smoothWave * 14.0f);
	targetPowerW = 4.41f + (smoothWave * 0.59f);

	pzemVoltage = targetVoltageV;
	pzemPower = targetPowerW;
	pzemCurrent = pzemPower / pzemVoltage;

	pzemEnergy += pzemPower * (PZEM_INTERVAL / 3600000.0f);

	Serial.print("PZEM Dummy -> V: ");
	Serial.print(pzemVoltage, 1);
	Serial.print(" V, I: ");
	Serial.print(pzemCurrent, 3);
	Serial.print(" A, P: ");
	Serial.print(pzemPower, 2);
	Serial.print(" W, E: ");
	Serial.print(pzemEnergy, 4);
	Serial.println(" kWh");
}

void uploadPzemTelemetry() {
	if (millis() - lastFirebaseUpload < FIREBASE_INTERVAL) {
		return;
	}

	lastFirebaseUpload = millis();

	if (!Firebase.ready() || !signupOK) {
		Serial.println("Firebase not ready");
		return;
	}

	FirebaseJson payload;
	payload.set("voltage", pzemVoltage);
	payload.set("current", pzemCurrent);
	payload.set("power", pzemPower);
	payload.set("energy", pzemEnergy);
	payload.set("updatedAt/.sv", "timestamp");

	bool ok = Firebase.RTDB.updateNode(&fbdo, basePath + "/latest", &payload);
	if (ok) {
		Serial.println("PZEM data uploaded to Firebase");
	} else {
		Serial.print("Firebase upload failed: ");
		Serial.println(fbdo.errorReason());
	}
}

void setup() {
	Serial.begin(115200);
	delay(1000);

	basePath = "properties/" + propertyId + "/rooms/" + roomId;

	WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
	Serial.print("Connecting WiFi");

	unsigned long wifiStart = millis();
	while (WiFi.status() != WL_CONNECTED && millis() - wifiStart < 20000) {
		delay(250);
		Serial.print(".");
	}

	wifiConnected = (WiFi.status() == WL_CONNECTED);
	Serial.println(wifiConnected ? "\nWiFi Connected" : "\nWiFi Failed");

	config.api_key = API_KEY;
	config.database_url = DATABASE_URL;

	if (Firebase.signUp(&config, &auth, "", "")) {
		signupOK = true;
	} else {
		Serial.printf("Firebase Signup Failed: %s\n", config.signer.signupError.message.c_str());
	}

	config.token_status_callback = tokenStatusCallback;
	Firebase.begin(&config, &auth);
	Firebase.reconnectWiFi(true);

	Serial.println("PZEM dummy telemetry ready");
}

void loop() {
	updatePzemDummyReading();
	uploadPzemTelemetry();
	delay(50);
}
