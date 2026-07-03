#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

// ======================
// WiFi
// ======================
#define WIFI_SSID "ESP32"
#define WIFI_PASSWORD "12345678"

// ======================
// Firebase
// ======================
#define API_KEY "AIzaSyCO7vsvUvYaLI11r9wjztYuMIteG4AorrY"
#define DATABASE_URL "https://esp32led-b6105-c0b99-default-rtdb.asia-southeast1.firebasedatabase.app/"

// ======================
// RELAY CONFIG (IMPORTANT)
// Most 8-channel optocoupler relay boards = ACTIVE LOW
// ======================
#define RELAY_ACTIVE_LOW true

// ======================
// GPIO PINS
// ======================
#define RELAY_EXHAUST_FAN 26 // Perpul wire = IN 3
#define RELAY_PRESENCE    14 // Gray = IN 4 
#define RELAY_LIGHTS      13 // green wire = IN 1 
#define RELAY_PUMP        5 // Yellow wire = IN 2

// ======================
// Firebase paths
// ======================
#define PROPERTY_ID "property_001"
#define ROOM_ID     "room_001"
#define ROOM_PATH   "properties/" PROPERTY_ID "/rooms/" ROOM_ID

#define PATH_EXHAUST ROOM_PATH "/devices/exhaustFan"
#define PATH_MOTION  ROOM_PATH "/devices/motionDetection"
#define PATH_LIGHTS  ROOM_PATH "/devices/lights"
#define PATH_PUMP    ROOM_PATH "/devices/waterPump"

#define PATH_GAS          ROOM_PATH "/latest/gas"
#define PATH_HUMAN        ROOM_PATH "/latest/humanPresent"
#define PATH_MOTION_LATEST ROOM_PATH "/latest/motionDetected"
#define PATH_PIR          ROOM_PATH "/latest/pir"

const float GAS_DETECTED_THRESHOLD = 500.0;

// ======================
// Firebase objects
// ======================
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

bool signupOK = false;

// ======================
// States
// ======================
bool cmdExhaust = false;
bool cmdMotionEnable = false;
bool cmdLights = false;
bool cmdPump = false;

bool gasDetected = false;
bool occDetected = false;

// runtime states
bool relayFan = false;
bool relayPresence = false;
bool relayLight = false;
bool relayPump = false;

// timing
unsigned long lastGasTime = 0;

const unsigned long GAS_DELAY = 15000;

unsigned long lastRead = 0;
const unsigned long interval = 500;

// ======================
// RELAY CONTROL
// ======================
void writeRelay(int pin, bool state) {
  if (RELAY_ACTIVE_LOW) {
    digitalWrite(pin, state ? LOW : HIGH);
  } else {
    digitalWrite(pin, state ? HIGH : LOW);
  }
}

// ======================
// READ FIREBASE BOOL
// ======================
bool fbReadBool(const char *path, bool fallback) {
  if (Firebase.RTDB.getBool(&fbdo, path)) {
    return fbdo.boolData();
  }
  return fallback;
}

float fbReadFloat(const char *path, float fallback) {
  if (Firebase.RTDB.getFloat(&fbdo, path)) {
    return fbdo.floatData();
  }
  return fallback;
}

// ======================
// APPLY RELAYS
// ======================
void applyRelays() {
  writeRelay(RELAY_EXHAUST_FAN, relayFan);
  writeRelay(RELAY_PRESENCE, relayPresence);
  writeRelay(RELAY_LIGHTS, relayLight);
  writeRelay(RELAY_PUMP, relayPump);
}

// ======================
// LOGIC ENGINE
// ======================
void updateLogic() {
  unsigned long now = millis();

  if (gasDetected) lastGasTime = now;

  // ===== EXHAUST FAN (gas priority)
  if (gasDetected) {
    relayFan = true;
  } else {
    if ((now - lastGasTime) <= GAS_DELAY) {
      relayFan = true;
    } else {
      relayFan = cmdExhaust;
    }
  }

  // ===== PRESENCE RELAY (dashboard control)
  relayPresence = cmdMotionEnable;

  // ===== LIGHTS (manual)
  relayLight = cmdLights;

  // ===== PUMP (manual)
  relayPump = cmdPump;

  applyRelays();
}

// ======================
// SETUP
// ======================
void setup() {
  Serial.begin(115200);

  pinMode(RELAY_EXHAUST_FAN, OUTPUT);
  pinMode(RELAY_PRESENCE, OUTPUT);
  pinMode(RELAY_LIGHTS, OUTPUT);
  pinMode(RELAY_PUMP, OUTPUT);

  applyRelays();

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
  }

  Serial.println("\nWiFi Connected");

  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  if (Firebase.signUp(&config, &auth, "", "")) {
    signupOK = true;
  }

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

// ======================
// LOOP
// ======================
void loop() {
  if (!Firebase.ready() || !signupOK) return;

  unsigned long now = millis();
  if (now - lastRead < interval) return;
  lastRead = now;

  // ===== READ COMMANDS
  cmdExhaust = fbReadBool(PATH_EXHAUST, cmdExhaust);
  cmdMotionEnable = fbReadBool(PATH_MOTION, cmdMotionEnable);
  cmdLights = fbReadBool(PATH_LIGHTS, cmdLights);
  cmdPump = fbReadBool(PATH_PUMP, cmdPump);

  // ===== READ SENSORS
  float gasValue = fbReadFloat(PATH_GAS, gasDetected ? GAS_DETECTED_THRESHOLD : 0.0);
  gasDetected = gasValue >= GAS_DETECTED_THRESHOLD;

  occDetected = fbReadBool(
    PATH_HUMAN,
    fbReadBool(PATH_MOTION_LATEST, fbReadBool(PATH_PIR, occDetected))
  );

  updateLogic();

  Serial.printf(
    "FAN:%d PRES:%d LIGHT:%d PUMP:%d | GAS:%d(%.1f) OCC:%d MOTION:%d\n",
    relayFan,
    relayPresence,
    relayLight,
    relayPump,
    gasDetected,
    gasValue,
    occDetected,
    cmdMotionEnable
  );
}