/*
 * ══════════════════════════════════════════════════════════════════════
 *  GREEN HOME HUB — ESP32 IoT Node Firmware
 *  Tourist Accommodation Energy Management System
 *  ICT 481-6 Capstone | Research Group 12
 * ══════════════════════════════════════════════════════════════════════
 *
 *  HARDWARE WIRING:
 *  ┌────────────────┬─────────────┬────────────────────────────────────┐
 *  │ Sensor         │ ESP32 Pin   │ Notes                             │
 *  ├────────────────┼─────────────┼────────────────────────────────────┤
 *  │ PZEM-004T TX   │ GPIO16 (RX2)│ HardwareSerial2                   │
 *  │ PZEM-004T RX   │ GPIO17 (TX2)│ HardwareSerial2                   │
 *  │ PIR Motion     │ GPIO27      │ Digital HIGH = motion              │
 *  │ Reed Switch    │ GPIO26      │ Digital HIGH = door open           │
 *  │ MQ-2 Gas       │ GPIO34      │ Analog (ADC1_CH6)                 │
 *  │ DHT22          │ GPIO4       │ Data pin (10K pullup to 3.3V)     │
 *  │ Relay 1 (Light)│ GPIO13      │ Active LOW                        │
 *  │ Relay 2 (Fan)  │ GPIO12      │ Active LOW                        │
 *  │ Relay 3 (Pump) │ GPIO14      │ Active LOW                        │
 *  │ Buzzer         │ GPIO25      │ Active HIGH                       │
 *  │ Status LED     │ GPIO2       │ Built-in (connection indicator)   │
 *  └────────────────┴─────────────┴────────────────────────────────────┘
 *
 *  REQUIRED LIBRARIES (install via Arduino Library Manager):
 *   - Firebase ESP Client (by Mobizt)     → Firebase RTDB
 *   - PZEM004Tv30                         → Energy meter
 *   - DHT sensor library (by Adafruit)    → DHT22
 *   - WiFiManager (by tzapu)              → Captive portal WiFi setup
 *   - ArduinoJson                         → JSON handling
 */

#include <WiFi.h>
#include <WiFiManager.h>
#include <Firebase_ESP_Client.h>
#include <PZEM004Tv30.h>
#include <DHT.h>
#include <ArduinoJson.h>

// Firebase helpers
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

// ═══════════════════════════════════════════════════════
//  CONFIGURATION — CHANGE THESE FOR YOUR SETUP
// ═══════════════════════════════════════════════════════

// Firebase credentials (from your Firebase Console)
#define FIREBASE_API_KEY      "YOUR_FIREBASE_API_KEY"
#define FIREBASE_DATABASE_URL "https://YOUR_PROJECT.firebasedatabase.app"

// Property and Room identifiers
#define PROPERTY_ID   "property_001"
#define ROOM_ID       "room_001"

// ═══════════════════════════════════════════════════════
//  PIN DEFINITIONS
// ═══════════════════════════════════════════════════════

// Sensors
#define PZEM_RX_PIN   16
#define PZEM_TX_PIN   17
#define PIR_PIN       27
#define REED_PIN      26
#define GAS_PIN       34   // Analog
#define DHT_PIN       4
#define DHT_TYPE      DHT22

// Actuators
#define RELAY_LIGHT   13
#define RELAY_FAN     12
#define RELAY_PUMP    14
#define BUZZER_PIN    25
#define LED_PIN       2    // Built-in LED

// ═══════════════════════════════════════════════════════
//  THRESHOLDS
// ═══════════════════════════════════════════════════════

#define GAS_DANGER_THRESHOLD     800    // ADC value (0-4095)
#define GAS_WARNING_THRESHOLD    500
#define SENSOR_READ_INTERVAL     2000   // 2 seconds
#define FIREBASE_PUSH_INTERVAL   3000   // 3 seconds
#define DEVICE_LISTEN_INTERVAL   2000   // 2 seconds

// ═══════════════════════════════════════════════════════
//  GLOBAL OBJECTS
// ═══════════════════════════════════════════════════════

PZEM004Tv30 pzem(Serial2, PZEM_RX_PIN, PZEM_TX_PIN);
DHT dht(DHT_PIN, DHT_TYPE);

FirebaseData fbdo;
FirebaseData fbdoStream;   // For device command listening
FirebaseAuth fbAuth;
FirebaseConfig fbConfig;

// Firebase path helpers
String basePath;
String latestPath;
String devicesPath;
String alertsPath;
String historyPath;

// ═══════════════════════════════════════════════════════
//  SENSOR DATA STRUCT
// ═══════════════════════════════════════════════════════

struct SensorReadings {
  // PZEM-004T
  float voltage;
  float current;
  float power;
  float energy;       // Cumulative kWh

  // PIR
  bool pirDetected;

  // Reed Switch
  bool doorOpen;

  // MQ-2 Gas
  int gasLevel;

  // DHT22
  float temperature;
  float humidity;

  // Occupancy State (computed locally)
  String occupancyState;
};

SensorReadings readings;

// ═══════════════════════════════════════════════════════
//  DEVICE STATE (controlled from dashboard)
// ═══════════════════════════════════════════════════════

struct DeviceState {
  bool lights;
  bool exhaustFan;
  bool waterPump;
  bool buzzer;
  bool motionDetection;
  bool mainRelay;
};

DeviceState devices = { false, false, false, false, true, false };

// ═══════════════════════════════════════════════════════
//  TIMING
// ═══════════════════════════════════════════════════════

unsigned long lastSensorRead = 0;
unsigned long lastFirebasePush = 0;
unsigned long lastDeviceListen = 0;
unsigned long lastMotionTime = 0;    // For vacancy timeout

#define VACANCY_TIMEOUT_MS 300000    // 5 minutes no motion = vacant

bool firebaseReady = false;

// ═══════════════════════════════════════════════════════
//  SETUP
// ═══════════════════════════════════════════════════════

void setup() {
  Serial.begin(115200);
  Serial.println("\n═══════════════════════════════════════");
  Serial.println("  GREEN HOME HUB — ESP32 Node v1.0");
  Serial.println("═══════════════════════════════════════\n");

  // Pin modes
  pinMode(PIR_PIN, INPUT);
  pinMode(REED_PIN, INPUT_PULLUP);
  pinMode(GAS_PIN, INPUT);
  pinMode(RELAY_LIGHT, OUTPUT);
  pinMode(RELAY_FAN, OUTPUT);
  pinMode(RELAY_PUMP, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);

  // Relays OFF (active LOW)
  digitalWrite(RELAY_LIGHT, HIGH);
  digitalWrite(RELAY_FAN, HIGH);
  digitalWrite(RELAY_PUMP, HIGH);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_PIN, LOW);

  // Initialize DHT
  dht.begin();

  // ─── WiFi Setup (Captive Portal) ───
  setupWiFi();

  // ─── Firebase Setup ───
  setupFirebase();
}

// ═══════════════════════════════════════════════════════
//  MAIN LOOP
// ═══════════════════════════════════════════════════════

void loop() {
  unsigned long now = millis();

  // ─── 1. Read all sensors ───
  if (now - lastSensorRead >= SENSOR_READ_INTERVAL) {
    readAllSensors();
    computeOccupancyState();
    handleLocalEmergencies();     // Gas emergency = instant buzzer
    applyRelayStates();
    lastSensorRead = now;
  }

  // ─── 2. Push to Firebase ───
  if (firebaseReady && (now - lastFirebasePush >= FIREBASE_PUSH_INTERVAL)) {
    pushToFirebase();
    lastFirebasePush = now;
  }

  // ─── 3. Listen for device commands from dashboard ───
  if (firebaseReady && (now - lastDeviceListen >= DEVICE_LISTEN_INTERVAL)) {
    listenForDeviceCommands();
    lastDeviceListen = now;
  }

  // Blink LED to show alive
  digitalWrite(LED_PIN, (millis() / 500) % 2);
}

// ═══════════════════════════════════════════════════════
//  WIFI SETUP (WiFiManager Captive Portal)
// ═══════════════════════════════════════════════════════

void setupWiFi() {
  Serial.println("[WiFi] Starting WiFiManager...");

  WiFiManager wm;
  // Uncomment to reset saved credentials during development:
  // wm.resetSettings();

  wm.setConfigPortalTimeout(180);  // 3 minutes timeout

  // Auto-connect or start AP named "GreenHomeHub-Setup"
  bool connected = wm.autoConnect("GreenHomeHub-Setup", "ghh12345");

  if (!connected) {
    Serial.println("[WiFi] ✗ Failed to connect. Restarting...");
    delay(3000);
    ESP.restart();
  }

  Serial.print("[WiFi] ✓ Connected! IP: ");
  Serial.println(WiFi.localIP());
}

// ═══════════════════════════════════════════════════════
//  FIREBASE SETUP
// ═══════════════════════════════════════════════════════

void setupFirebase() {
  Serial.println("[Firebase] Initializing...");

  fbConfig.api_key = FIREBASE_API_KEY;
  fbConfig.database_url = FIREBASE_DATABASE_URL;

  // Anonymous sign-in (no email/password needed for the ESP32 node)
  // Make sure your Firebase Database Rules allow writes from this path
  Firebase.signUp(&fbConfig, &fbAuth, "", "");

  fbConfig.token_status_callback = tokenStatusCallback;

  Firebase.begin(&fbConfig, &fbAuth);
  Firebase.reconnectWiFi(true);

  // Build paths
  basePath = String("properties/") + PROPERTY_ID + "/rooms/" + ROOM_ID;
  latestPath = basePath + "/latest";
  devicesPath = basePath + "/devices";
  alertsPath = String("properties/") + PROPERTY_ID + "/alerts";
  historyPath = String("properties/") + PROPERTY_ID + "/history";

  // Wait for token
  unsigned long start = millis();
  while (!Firebase.ready() && (millis() - start < 10000)) {
    delay(100);
  }

  if (Firebase.ready()) {
    firebaseReady = true;
    Serial.println("[Firebase] ✓ Connected & authenticated");

    // Set initial LED status
    Firebase.RTDB.setInt(&fbdo, latestPath + "/ledStatus", 1);
  } else {
    Serial.println("[Firebase] ✗ Connection failed. Will retry in loop.");
  }
}

// ═══════════════════════════════════════════════════════
//  SENSOR READING
// ═══════════════════════════════════════════════════════

void readAllSensors() {
  // ─── PZEM-004T Energy Meter ───
  readings.voltage = pzem.voltage();
  readings.current = pzem.current();
  readings.power   = pzem.power();
  readings.energy  = pzem.energy();

  // Handle NaN (sensor not connected or error)
  if (isnan(readings.voltage)) readings.voltage = 0;
  if (isnan(readings.current)) readings.current = 0;
  if (isnan(readings.power))   readings.power = 0;
  if (isnan(readings.energy))  readings.energy = 0;

  // ─── PIR Motion ───
  readings.pirDetected = digitalRead(PIR_PIN) == HIGH;
  if (readings.pirDetected) {
    lastMotionTime = millis();
  }

  // ─── Reed Switch (Door) ───
  readings.doorOpen = digitalRead(REED_PIN) == HIGH;

  // ─── MQ-2 Gas ───
  readings.gasLevel = analogRead(GAS_PIN);

  // ─── DHT22 ───
  readings.temperature = dht.readTemperature();
  readings.humidity = dht.readHumidity();
  if (isnan(readings.temperature)) readings.temperature = 0;
  if (isnan(readings.humidity))    readings.humidity = 0;

  // Debug output
  Serial.printf("[Sensors] V:%.1f A:%.2f P:%.1f kWh:%.3f PIR:%d Door:%d Gas:%d T:%.1f H:%.1f\n",
    readings.voltage, readings.current, readings.power, readings.energy,
    readings.pirDetected, readings.doorOpen, readings.gasLevel,
    readings.temperature, readings.humidity);
}

// ═══════════════════════════════════════════════════════
//  OCCUPANCY STATE MACHINE
// ═══════════════════════════════════════════════════════
//
//  States: VACANT, DOOR_OPENED, ENTERING, OCCUPIED_ACTIVE,
//          OCCUPIED_IDLE, LEAVING, VACANT_CONFIRMED
//
//  The dashboard's occupancyLogic.ts mirrors this,
//  but we compute locally so the ESP can auto-shed
//  even if WiFi drops.

void computeOccupancyState() {
  static String previousState = "VACANT";
  String newState = previousState;

  bool pir = readings.pirDetected;
  bool door = readings.doorOpen;
  unsigned long timeSinceMotion = millis() - lastMotionTime;

  if (previousState == "VACANT") {
    if (door) newState = "DOOR_OPENED";
  }
  else if (previousState == "DOOR_OPENED") {
    if (pir) newState = "ENTERING";
    else if (!door) newState = "VACANT";  // Door closed without entry
  }
  else if (previousState == "ENTERING") {
    if (!door && pir) newState = "OCCUPIED_ACTIVE";
  }
  else if (previousState == "OCCUPIED_ACTIVE") {
    if (!pir && timeSinceMotion > 60000) {  // 1 min no motion
      newState = "OCCUPIED_IDLE";
    }
    if (door) newState = "LEAVING";
  }
  else if (previousState == "OCCUPIED_IDLE") {
    if (pir) newState = "OCCUPIED_ACTIVE";  // Person moved again
    if (door) newState = "LEAVING";
    if (timeSinceMotion > VACANCY_TIMEOUT_MS) {
      newState = "VACANT_CONFIRMED";        // Timeout → vacancy
    }
  }
  else if (previousState == "LEAVING") {
    if (!door && !pir) newState = "VACANT_CONFIRMED";
    if (!door && pir)  newState = "OCCUPIED_ACTIVE";  // False alarm
  }
  else if (previousState == "VACANT_CONFIRMED") {
    // Auto-shed has happened, go back to VACANT
    newState = "VACANT";
  }

  if (newState != previousState) {
    Serial.printf("[Occupancy] %s → %s\n", previousState.c_str(), newState.c_str());
    previousState = newState;

    // ─── AUTO-SHED on VACANT_CONFIRMED ───
    if (newState == "VACANT_CONFIRMED") {
      Serial.println("[Automation] Room vacant → Shedding loads");
      devices.lights = false;
      devices.exhaustFan = false;
      // Keep waterPump as-is (tank level based)
    }
  }

  readings.occupancyState = newState;
}

// ═══════════════════════════════════════════════════════
//  LOCAL EMERGENCY HANDLING (runs BEFORE Firebase sync)
// ═══════════════════════════════════════════════════════

void handleLocalEmergencies() {
  if (readings.gasLevel > GAS_DANGER_THRESHOLD) {
    // IMMEDIATE local response — don't wait for Firebase
    digitalWrite(BUZZER_PIN, HIGH);
    Serial.println("[EMERGENCY] ⚠ HIGH GAS — Buzzer ON");

    // Push alert to Firebase (non-blocking attempt)
    if (firebaseReady) {
      FirebaseJson alertJson;
      alertJson.set("type", "gas");
      alertJson.set("level", "danger");
      alertJson.set("message", "High gas level detected: " + String(readings.gasLevel));
      alertJson.set("acknowledged", false);
      alertJson.set("createdAt/.sv", "timestamp");

      Firebase.RTDB.pushJSON(&fbdo, alertsPath, &alertJson);
    }
  } else if (readings.gasLevel < GAS_WARNING_THRESHOLD) {
    // Only turn off buzzer if gas drops below warning threshold
    if (!devices.buzzer) {
      digitalWrite(BUZZER_PIN, LOW);
    }
  }
}

// ═══════════════════════════════════════════════════════
//  RELAY CONTROL
// ═══════════════════════════════════════════════════════

void applyRelayStates() {
  // Active LOW relays
  digitalWrite(RELAY_LIGHT, devices.lights ? LOW : HIGH);
  digitalWrite(RELAY_FAN,   devices.exhaustFan ? LOW : HIGH);
  digitalWrite(RELAY_PUMP,  devices.waterPump ? LOW : HIGH);

  // Buzzer (active HIGH) — only if not in gas emergency
  if (readings.gasLevel <= GAS_DANGER_THRESHOLD) {
    digitalWrite(BUZZER_PIN, devices.buzzer ? HIGH : LOW);
  }
}

// ═══════════════════════════════════════════════════════
//  FIREBASE PUSH (sensor data → RTDB)
// ═══════════════════════════════════════════════════════

void pushToFirebase() {
  if (!Firebase.ready()) {
    firebaseReady = false;
    Serial.println("[Firebase] Not ready, skipping push");
    return;
  }

  firebaseReady = true;

  FirebaseJson json;
  json.set("voltage",        readings.voltage);
  json.set("current",        readings.current);
  json.set("power",          readings.power);
  json.set("energy",         readings.energy);
  json.set("pir",            readings.pirDetected);
  json.set("doorOpen",       readings.doorOpen);
  json.set("gas",            readings.gasLevel);
  json.set("temperature",    readings.temperature);
  json.set("humidity",       readings.humidity);
  json.set("occupancyState", readings.occupancyState);
  json.set("ledStatus",      1);  // Node alive indicator
  json.set("updatedAt/.sv",  "timestamp");

  if (Firebase.RTDB.setJSON(&fbdo, latestPath, &json)) {
    Serial.println("[Firebase] ✓ Pushed sensor data");
  } else {
    Serial.printf("[Firebase] ✗ Push failed: %s\n", fbdo.errorReason().c_str());
  }

  // Also push to history (every push for thesis data collection)
  FirebaseJson historyEntry;
  historyEntry.set("roomId", ROOM_ID);
  historyEntry.set("power", readings.power);
  historyEntry.set("energy", readings.energy);
  historyEntry.set("pir", readings.pirDetected);
  historyEntry.set("doorOpen", readings.doorOpen);
  historyEntry.set("gas", readings.gasLevel);
  historyEntry.set("occupancyState", readings.occupancyState);
  historyEntry.set("createdAt/.sv", "timestamp");

  Firebase.RTDB.pushJSON(&fbdo, historyPath, &historyEntry);
}

// ═══════════════════════════════════════════════════════
//  LISTEN FOR DEVICE COMMANDS (dashboard → ESP32)
// ═══════════════════════════════════════════════════════

void listenForDeviceCommands() {
  if (!Firebase.ready()) return;

  if (Firebase.RTDB.getJSON(&fbdo, devicesPath)) {
    FirebaseJson &json = fbdo.jsonData();
    FirebaseJsonData result;

    if (json.get(result, "lights"))          devices.lights = result.boolValue;
    if (json.get(result, "exhaustFan"))      devices.exhaustFan = result.boolValue;
    if (json.get(result, "waterPump"))       devices.waterPump = result.boolValue;
    if (json.get(result, "buzzer"))          devices.buzzer = result.boolValue;
    if (json.get(result, "motionDetection")) devices.motionDetection = result.boolValue;
    if (json.get(result, "mainRelay"))       devices.mainRelay = result.boolValue;

    Serial.printf("[Devices] Lights:%d Fan:%d Pump:%d Buzzer:%d\n",
      devices.lights, devices.exhaustFan, devices.waterPump, devices.buzzer);
  }
}
