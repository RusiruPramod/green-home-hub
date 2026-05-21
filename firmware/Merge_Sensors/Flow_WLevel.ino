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

unsigned long lastFlowUpdate = 0;
unsigned long lastFirebaseUpdate = 0;
const unsigned long FIREBASE_PUSH_INTERVAL = 3000;

float calibrationFactor = 320.0;

// ======================
// Water Sensor Config
// ======================
#define WATER_SENSOR_PIN 34

#define DRY_VALUE 1200
#define WET_VALUE 1800

const char* waterFirebasePath =
"/properties/property_001/rooms/room_001/latest/waterLevel";

// ======================
// ISR
// ======================
void IRAM_ATTR pulseCounter() {
  pulseCount++;
}

// ======================
// Stable Water Read
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
  float percent = ((float)(raw - DRY_VALUE) / (WET_VALUE - DRY_VALUE)) * 100.0;
  percent = constrain(percent, 0, 100);
  return (int)percent;
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

  pinMode(WATER_SENSOR_PIN, INPUT);

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

  if (currentTime - lastFirebaseUpdate >= FIREBASE_PUSH_INTERVAL) {
    lastFirebaseUpdate = currentTime;

    if (Firebase.ready() && signupOK) {

      FirebaseJson payload;
      payload.set("flowRate", flowRate);
      payload.set("totalLiters", totalLiters);
      payload.set("updatedAt/.sv", "timestamp");

      Firebase.RTDB.setJSON(&fbdo, basePath + "/latest", &payload);

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
// Water Sensor Firebase
// ======================
void updateWaterSensor() {

  int rawValue = readWaterSensor();
  int waterPercent = getWaterPercent(rawValue);

  Serial.print("Raw: ");
  Serial.print(rawValue);
  Serial.print(" | Water Level: ");
  Serial.print(waterPercent);
  Serial.println("%");

  if (Firebase.ready() && signupOK) {
    Firebase.RTDB.setInt(&fbdo, waterFirebasePath, waterPercent);
  }
}

// ======================
// LOOP
// ======================
void loop() {
  updateLEDAndFirebase();
  updateFlowSensorAndFirebase();
  updateWaterSensor();
  delay(10);
}