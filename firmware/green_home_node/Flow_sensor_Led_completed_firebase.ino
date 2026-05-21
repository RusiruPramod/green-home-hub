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

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// ======================
// Device IDs (IMPORTANT)
// ======================
String propertyId = "property_001";
String roomId = "room_001";

// Base Path (NEW STRUCTURE)
String basePath;

// ======================
// LED Configuration
// ======================
int ledPin = 2;
bool signupOK = false;
unsigned long lastLEDUpdate = 0;
bool ledState = false;

// ======================
// Flow Sensor Configuration
// ======================
const int flowPin = 35;
volatile int pulseCount = 0;

float flowRate = 0.0;
float totalLiters = 0.0;

unsigned long lastFlowUpdate = 0;
unsigned long lastFirebaseUpdate = 0;

float calibrationFactor = 320.0;

// ======================
// Interrupt
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

  Serial.println("\n=== ESP32 Firebase Structured IoT ===");

  // Build Firebase path
  basePath = "/properties/" + propertyId + "/rooms/" + roomId;

  // LED setup
  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, LOW);

  // Flow sensor setup
  pinMode(flowPin, INPUT);
  attachInterrupt(digitalPinToInterrupt(flowPin), pulseCounter, RISING);

  // ======================
  // WiFi
  // ======================
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi Connected");

  // ======================
  // Firebase Setup
  // ======================
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  if (Firebase.signUp(&config, &auth, "", "")) {
    signupOK = true;
    Serial.println("Firebase Auth OK");
  }

  config.token_status_callback = tokenStatusCallback;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  Serial.println("System Ready");
}

// ======================
// LED Control (NEW PATH)
// ======================
void updateLEDAndFirebase() {

  if (millis() - lastLEDUpdate > 3000) {

    lastLEDUpdate = millis();

    ledState = !ledState;

    digitalWrite(ledPin, ledState);

   
  }
}

// ======================
// Flow + Firebase Upload
// ======================
void updateFlowSensorAndFirebase() {

  unsigned long currentTime = millis();

  // Every 1 second calculate flow
  if (currentTime - lastFlowUpdate >= 1000) {

    detachInterrupt(flowPin);

    flowRate = ((pulseCount * 60.0) / calibrationFactor);
    totalLiters += (flowRate / 60.0);

    pulseCount = 0;
    lastFlowUpdate = currentTime;

    attachInterrupt(digitalPinToInterrupt(flowPin), pulseCounter, RISING);

    Serial.print("Flow: ");
    Serial.print(flowRate);
    Serial.print(" L/min | Total: ");
    Serial.println(totalLiters);
  }

  // Firebase upload every 2 sec
  if (currentTime - lastFirebaseUpdate >= 2000) {

    lastFirebaseUpdate = currentTime;

    if (Firebase.ready() && signupOK) {

      // latest/flowRate
      Firebase.RTDB.setFloat(
        &fbdo,
        basePath + "/latest/flowRate",
        flowRate
      );

      // latest/totalLiters
      Firebase.RTDB.setFloat(
        &fbdo,
        basePath + "/latest/totalLiters",
        totalLiters
      );

      // latest/updatedAt
      Firebase.RTDB.setInt(
        &fbdo,
        basePath + "/latest/updatedAt",
        currentTime / 1000
      );

      Serial.println("Firebase Updated → latest + devices");
    }
  }
}

// ======================
// Loop
// ======================
void loop() {

  updateLEDAndFirebase();
  updateFlowSensorAndFirebase();

  delay(100);
}