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
// LED Config
// ======================
const int ledPin = 2;

unsigned long lastLEDUpdate = 0;
const unsigned long LED_POLL_INTERVAL = 1500;

bool lastKnownLedState = false;

// ======================
// Flow Sensor Config
// ======================
const int flowPin = 35;

volatile int pulseCount = 0;

float flowRate = 0.0;
float totalLiters = 0.0;
float deltaLiters = 0.0;

float calibrationFactor = 320.0;

unsigned long lastFlowCalc = 0;

// ✅ NEW: accumulator for history interval
float pendingHistoryDeltaLiters = 0.0;

// ======================
// Water Sensor Config
// ======================
#define WATER_SENSOR_PIN 34

#define DRY_VALUE 1200
#define WET_VALUE 1800

int waterPercent = 0;

unsigned long lastWaterRead = 0;

// ======================
// Firebase Timing
// ======================
unsigned long lastFirebaseUpload = 0;

const unsigned long FLOW_INTERVAL = 1000;
const unsigned long WATER_INTERVAL = 1000;
const unsigned long FIREBASE_INTERVAL = 3000;

// ======================
// ISR
// ======================
void IRAM_ATTR pulseCounter() {
  pulseCount++;
}

// ======================
// Water Sensor Helper
// ======================
int readWaterSensor() {

  long total = 0;

  for (int i = 0; i < 20; i++) {
    total += analogRead(WATER_SENSOR_PIN);
    delay(5);
  }

  return total / 20;
}

int getWaterPercent(int raw) {

  float percent =
    ((float)(raw - DRY_VALUE) / (WET_VALUE - DRY_VALUE)) * 100.0;

  percent = constrain(percent, 0, 100);

  return (int)percent;
}

// ======================
// SETUP
// ======================
void setup() {

  Serial.begin(115200);
  delay(1000);

  basePath = "properties/" + propertyId + "/rooms/" + roomId;

  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, LOW);

  pinMode(flowPin, INPUT);
  attachInterrupt(digitalPinToInterrupt(flowPin), pulseCounter, RISING);

  pinMode(WATER_SENSOR_PIN, INPUT);

  // ======================
  // WiFi
  // ======================
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting WiFi");

  unsigned long wifiStart = millis();

  while (WiFi.status() != WL_CONNECTED && millis() - wifiStart < 20000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi Failed");
  }

  // ======================
  // Firebase
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
// LED SYNC
// ======================
void updateLED() {

  if (!Firebase.ready() || !signupOK) return;

  if (millis() - lastLEDUpdate >= LED_POLL_INTERVAL) {

    lastLEDUpdate = millis();

    if (Firebase.RTDB.getBool(&fbdoLED, "/led")) {

      bool state = fbdoLED.boolData();

      if (state != lastKnownLedState) {

        lastKnownLedState = state;
        digitalWrite(ledPin, state ? HIGH : LOW);

        Serial.print("LED: ");
        Serial.println(state ? "ON" : "OFF");
      }

    } else {
      Serial.println(fbdoLED.errorReason());
    }
  }
}

// ======================
// FLOW UPDATE (FIXED)
// ======================
void updateFlowReading() {

  if (millis() - lastFlowCalc >= FLOW_INTERVAL) {

    lastFlowCalc = millis();

    noInterrupts();
    int pulses = pulseCount;
    pulseCount = 0;
    interrupts();

    // ✅ TRUE liters from pulses
    deltaLiters = pulses / calibrationFactor;

    totalLiters += deltaLiters;

    // ✅ accumulate for history
    pendingHistoryDeltaLiters += deltaLiters;

    // derived flow rate for UI only
    flowRate = deltaLiters * 60.0;

    Serial.print("Flow Rate: ");
    Serial.print(flowRate);
    Serial.print(" L/min");

    Serial.print(" | Delta: ");
    Serial.print(deltaLiters);

    Serial.print(" L | Total: ");
    Serial.print(totalLiters);
    Serial.println(" L");
  }
}

// ======================
// WATER UPDATE
// ======================
void updateWaterReading() {

  if (millis() - lastWaterRead >= WATER_INTERVAL) {

    lastWaterRead = millis();

    int rawValue = readWaterSensor();
    waterPercent = getWaterPercent(rawValue);

    Serial.print("Raw: ");
    Serial.print(rawValue);

    Serial.print(" | Water Level: ");
    Serial.print(waterPercent);
    Serial.println("%");
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
      payload.set("updatedAt/.sv", "timestamp");

      Firebase.RTDB.updateNode(&fbdo, basePath + "/latest", &payload);

      // ======================
      // HISTORY
      // ======================
      if (flowRate > 0.0) {

        FirebaseJson history;

        history.set("roomId", roomId);
        history.set("flowRate", flowRate);
        history.set("deltaLiters", pendingHistoryDeltaLiters);
        history.set("totalLiters", totalLiters);
        history.set("createdAt/.sv", "timestamp");

        bool historySuccess =
          Firebase.RTDB.pushJSON(
            &fbdo,
            "properties/" + propertyId + "/history",
            &history
          );

        if (historySuccess) {

          Serial.println("History pushed");

          // ✅ reset ONLY on success
          pendingHistoryDeltaLiters = 0.0;

        } else {
          Serial.println(fbdo.errorReason());
        }
      }
    }
  }
}

// ======================
// LOOP
// ======================
void loop() {

  updateLED();
  updateFlowReading();
  updateWaterReading();
  uploadLatestTelemetry();
}