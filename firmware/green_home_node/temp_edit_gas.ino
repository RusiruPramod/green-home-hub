#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

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
// Firebase Objects
// ======================
FirebaseData fbdo;
FirebaseData fbdoLED;
FirebaseAuth auth;
FirebaseConfig config;

bool signupOK = false;

// ======================
// Device IDs
// ======================
String propertyId = "property_001";
String roomId = "room_001";
String basePath;

// ======================
// LED PINS
// ======================
const int ledPin = 2;              // internal LED
const int extLedPin = 23;          //  external status LED (NEW)

// ======================
// LED STATE CONTROL
// ======================
unsigned long lastLEDUpdate = 0;
unsigned long lastHeartbeat = 0;

const unsigned long LED_POLL_INTERVAL = 1500;

bool lastKnownLedState = false;

// WiFi state tracking
bool wifiConnected = false;

// Firebase blink control
bool firebaseBlink = false;
unsigned long firebaseBlinkTime = 0;

// ======================
// FLOW SENSOR
// ======================
const int flowPin = 35;
volatile int pulseCount = 0;

float flowRate = 0.0;
float totalLiters = 0.0;
float deltaLiters = 0.0;

float calibrationFactor = 320.0;

unsigned long lastFlowCalc = 0;
float pendingHistoryDeltaLiters = 0.0;

// ======================
// WATER SENSOR
// ======================
#define WATER_SENSOR_PIN 34
#define DRY_VALUE 1200
#define WET_VALUE 1800

int waterPercent = 0;
unsigned long lastWaterRead = 0;

// ======================
// GAS SENSOR
// ======================
#define GAS_SENSOR_PIN 32
const int BUZZER_PIN = 25;
const int RELAY_PIN = 26;

int gasPpm = 0;
int gasRaw = 0;
int gasBaseline = 0;

bool gasDanger = false;
bool gasCalibrated = false;

int gasDangerConfirmCount = 0;
int gasNormalConfirmCount = 0;

unsigned long lastGasRead = 0;
unsigned long gasWarmupStartedAt = 0;

long gasBaselineTotal = 0;
int gasBaselineSamples = 0;

const unsigned long GAS_WARMUP_MS = 30000;   // Use 120000+ for final testing.
const int GAS_BASELINE_SAMPLES = 10;
const int GAS_SAMPLE_COUNT = 20;
const int GAS_SIGNAL_SPAN = 900;             // ADC increase mapped to demo level 0-1000.
const int GAS_DANGER_ON_THRESHOLD = 350;
const int GAS_DANGER_OFF_THRESHOLD = 220;
const int GAS_CONFIRM_SAMPLES = 3;

// ======================
// TIMERS
// ======================
unsigned long lastFirebaseUpload = 0;

const unsigned long FLOW_INTERVAL = 1000;
const unsigned long WATER_INTERVAL = 1000;
const unsigned long GAS_INTERVAL = 1000;
const unsigned long FIREBASE_INTERVAL = 3000;

// ======================
// ISR
// ======================
void IRAM_ATTR pulseCounter() {
  pulseCount++;
}

// ======================
// SETUP
// ======================
void setup() {

  Serial.begin(115200);
  delay(1000);

  basePath = "properties/" + propertyId + "/rooms/" + roomId;

  pinMode(ledPin, OUTPUT);
  pinMode(extLedPin, OUTPUT);

  digitalWrite(ledPin, LOW);
  digitalWrite(extLedPin, LOW);

  pinMode(flowPin, INPUT);
  attachInterrupt(digitalPinToInterrupt(flowPin), pulseCounter, RISING);

  pinMode(WATER_SENSOR_PIN, INPUT);

  pinMode(GAS_SENSOR_PIN, INPUT);
  analogSetPinAttenuation(GAS_SENSOR_PIN, ADC_11db);
  gasWarmupStartedAt = millis();

  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(RELAY_PIN, OUTPUT);

  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(RELAY_PIN, LOW);

  // ======================
  // WIFI START
  // ======================
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting WiFi");

  unsigned long wifiStart = millis();

  while (WiFi.status() != WL_CONNECTED && millis() - wifiStart < 20000) {
    wifiConnectingBlink();   //  FAST BLINK WHILE CONNECTING
    Serial.print(".");
  }

  wifiConnected = (WiFi.status() == WL_CONNECTED);

  Serial.println(wifiConnected ? "\nWiFi Connected" : "\nWiFi Failed");

  // ======================
  // FIREBASE
  // ======================
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  if (Firebase.signUp(&config, &auth, "", "")) {
    signupOK = true;
    Serial.println("Firebase Signup OK");
  } else {
    Serial.println(config.signer.signupError.message.c_str());
  }

  config.token_status_callback = tokenStatusCallback;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

// ======================
// LED EFFECTS
// ======================

//  WiFi CONNECTING → fast blink
void wifiConnectingBlink() {
  digitalWrite(extLedPin, HIGH);
  delay(100);
  digitalWrite(extLedPin, LOW);
  delay(100);
}

//  WiFi CONNECTED → slow breathing blink
void wifiConnectedBreathing() {
  float wave = (sin(millis() * 0.002) + 1.0) / 2.0;
  int brightness = wave * 255;
  analogWrite(extLedPin, brightness);
}

// ☁️ Firebase quick blink
void firebaseBlinkPulse() {
  digitalWrite(extLedPin, HIGH);
  delay(50);
  digitalWrite(extLedPin, LOW);
}

//  heartbeat (system alive)
void systemHeartbeat() {
  if (millis() - lastHeartbeat > 5000) {
    lastHeartbeat = millis();
    digitalWrite(extLedPin, HIGH);
    delay(80);
    digitalWrite(extLedPin, LOW);
  }
}

// ======================
// FLOW
// ======================
void updateFlowReading() {

  if (millis() - lastFlowCalc >= FLOW_INTERVAL) {

    lastFlowCalc = millis();

    noInterrupts();
    int pulses = pulseCount;
    pulseCount = 0;
    interrupts();

    deltaLiters = pulses / calibrationFactor;

    totalLiters += deltaLiters;
    pendingHistoryDeltaLiters += deltaLiters;

    flowRate = deltaLiters * 60.0;
  }
}

// ======================
// WATER
// ======================
void updateWaterReading() {
  if (millis() - lastWaterRead >= WATER_INTERVAL) {
    lastWaterRead = millis();
    int raw = analogRead(WATER_SENSOR_PIN);
    waterPercent = map(raw, 1200, 1800, 0, 100);
    waterPercent = constrain(waterPercent, 0, 100);
  }
}

// ======================
// GAS
// ======================
int readGasRawAverage() {
  long total = 0;

  for (int i = 0; i < GAS_SAMPLE_COUNT; i++) {
    total += analogRead(GAS_SENSOR_PIN);
    delay(2);
  }

  return total / GAS_SAMPLE_COUNT;
}

void updateGasReading() {

  if (millis() - lastGasRead >= GAS_INTERVAL) {

    lastGasRead = millis();

    gasRaw = readGasRawAverage();

    if (!gasCalibrated) {
      gasPpm = 0;
      gasDanger = false;
      digitalWrite(BUZZER_PIN, LOW);
      digitalWrite(RELAY_PIN, LOW);

      if (millis() - gasWarmupStartedAt < GAS_WARMUP_MS) {
        Serial.print("Gas warmup raw: ");
        Serial.println(gasRaw);
        return;
      }

      gasBaselineTotal += gasRaw;
      gasBaselineSamples++;

      Serial.print("Gas baseline sample ");
      Serial.print(gasBaselineSamples);
      Serial.print("/");
      Serial.print(GAS_BASELINE_SAMPLES);
      Serial.print(": ");
      Serial.println(gasRaw);

      if (gasBaselineSamples < GAS_BASELINE_SAMPLES) {
        return;
      }

      gasBaseline = gasBaselineTotal / GAS_BASELINE_SAMPLES;
      gasCalibrated = true;

      Serial.print("Gas baseline calibrated: ");
      Serial.println(gasBaseline);
      return;
    }

    int gasDelta = gasRaw - gasBaseline;
    gasDelta = max(gasDelta, 0);

    gasPpm = map(gasDelta, 0, GAS_SIGNAL_SPAN, 0, 1000);
    gasPpm = constrain(gasPpm, 0, 1000);

    if (!gasDanger) {
      if (gasPpm >= GAS_DANGER_ON_THRESHOLD) {
        gasDangerConfirmCount++;
      } else {
        gasDangerConfirmCount = 0;
      }

      if (gasDangerConfirmCount >= GAS_CONFIRM_SAMPLES) {
        gasDanger = true;
        gasDangerConfirmCount = 0;
      }
    } else {
      if (gasPpm <= GAS_DANGER_OFF_THRESHOLD) {
        gasNormalConfirmCount++;
      } else {
        gasNormalConfirmCount = 0;
      }

      if (gasNormalConfirmCount >= GAS_CONFIRM_SAMPLES) {
        gasDanger = false;
        gasNormalConfirmCount = 0;
      }
    }

    digitalWrite(BUZZER_PIN, gasDanger ? HIGH : LOW);
    digitalWrite(RELAY_PIN, gasDanger ? HIGH : LOW);

    Serial.print("Gas raw: ");
    Serial.print(gasRaw);
    Serial.print(" baseline: ");
    Serial.print(gasBaseline);
    Serial.print(" level: ");
    Serial.print(gasPpm);
    Serial.print(" danger: ");
    Serial.println(gasDanger ? "YES" : "NO");
  }
}

// ======================
// FIREBASE UPLOAD
// ======================
void uploadLatestTelemetry() {

  if (millis() - lastFirebaseUpload >= FIREBASE_INTERVAL) {

    lastFirebaseUpload = millis();

    if (Firebase.ready() && signupOK) {

      FirebaseJson payload;

      payload.set("flowRate", flowRate);
      payload.set("totalLiters", totalLiters);
      payload.set("waterLevel", waterPercent);
      payload.set("gas", gasPpm);
      payload.set("gasRaw", gasRaw);
      payload.set("gasBaseline", gasBaseline);
      payload.set("gasDanger", gasDanger);
      payload.set("updatedAt/.sv", "timestamp");

      Firebase.RTDB.updateNode(&fbdo, basePath + "/latest", &payload);

      //  Firebase blink signal
      firebaseBlinkPulse();

      if (flowRate > 0.0) {

        FirebaseJson history;

        history.set("roomId", roomId);
        history.set("flowRate", flowRate);
        history.set("deltaLiters", pendingHistoryDeltaLiters);
        history.set("totalLiters", totalLiters);
        history.set("createdAt/.sv", "timestamp");

        bool ok = Firebase.RTDB.pushJSON(
          &fbdo,
          "properties/" + propertyId + "/history",
          &history
        );

        if (ok) {
          pendingHistoryDeltaLiters = 0.0;
        }
      }
    }
  }
}

// ======================
// LOOP
// ======================
void loop() {

  updateFlowReading();
  updateWaterReading();
  updateGasReading();
  uploadLatestTelemetry();

  // ======================
  // STATUS LED CONTROLLER
  // ======================
  if (!wifiConnected) {
    wifiConnectingBlink();
  }
  else if (Firebase.ready() && signupOK) {
    wifiConnectedBreathing();   // normal system running
  }

  systemHeartbeat();
}
