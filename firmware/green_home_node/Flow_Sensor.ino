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

// Firebase Objects
FirebaseData fbdo;
FirebaseData fbdoLED;
FirebaseAuth auth;
FirebaseConfig config;

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
bool signupOK = false;

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

unsigned long lastFlowUpdate = 0;
unsigned long lastFirebaseUpdate = 0;
const unsigned long FIREBASE_PUSH_INTERVAL = 3000;

float calibrationFactor = 320.0;

// ======================
// ISR
// ======================
void IRAM_ATTR pulseCounter() {
  pulseCount++;
}

// ======================
// Setup
// ======================
void setup() {
  Serial.begin(115200);
  delay(1000);

  basePath = "properties/" + propertyId + "/rooms/" + roomId;

  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, LOW);

  pinMode(flowPin, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(flowPin), pulseCounter, RISING);

  // WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  // Firebase
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  if (Firebase.signUp(&config, &auth, "", "")) {
    signupOK = true;
  }

  config.token_status_callback = tokenStatusCallback;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

// ======================
// LED Sync
// ======================
void updateLEDAndFirebase() {
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
    }
  }
}

// ======================
// Flow + Firebase
// ======================
void updateFlowSensorAndFirebase() {
  unsigned long currentTime = millis();

  // Flow calculation
  if (currentTime - lastFlowUpdate >= 1000) {
    lastFlowUpdate = currentTime;

    noInterrupts();
    int pulses = pulseCount;
    pulseCount = 0;
    interrupts();

    flowRate = ((pulses * 60.0) / calibrationFactor);
    totalLiters += (flowRate / 60.0);

    Serial.printf("Flow: %.2f L/min | Total: %.2f L\n", flowRate, totalLiters);
  }

  // Firebase upload
  if (currentTime - lastFirebaseUpdate >= FIREBASE_PUSH_INTERVAL) {
    lastFirebaseUpdate = currentTime;

    if (Firebase.ready() && signupOK) {

      FirebaseJson payload;
      payload.set("flowRate", flowRate);
      payload.set("totalLiters", totalLiters);
      payload.set("updatedAt/.sv", "timestamp");

      Serial.println("Uploading data...");

      // ✅ FIXED LINE (IMPORTANT)
      if (Firebase.RTDB.setJSON(&fbdo, basePath + "/latest", &payload)) {
        Serial.println("Update success");
      } else {
        Serial.println(fbdo.errorReason());
      }

      if (flowRate > 0.0) {
        FirebaseJson history;
        history.set("roomId", roomId);
        history.set("flowRate", flowRate);
        history.set("createdAt/.sv", "timestamp");

        Firebase.RTDB.pushJSON(
          &fbdo,
          "properties/" + propertyId + "/history",
          &history
        );
      }
    }
  }
}

// ======================
// LOOP
// ======================
void loop() {
  updateLEDAndFirebase();
  updateFlowSensorAndFirebase();
  delay(10);
}