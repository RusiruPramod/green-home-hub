
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
// LED
// ======================
const int ledPin = 2;
unsigned long lastLEDUpdate = 0;
const unsigned long LED_POLL_INTERVAL = 1500;
bool lastKnownLedState = false;

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
// GAS SENSOR + SAFETY
// ======================
#define GAS_SENSOR_PIN 32
const int BUZZER_PIN = 25;
const int RELAY_PIN = 26;

int gasPpm = 0;
unsigned long lastGasRead = 0;

// Gas safety state
bool gasDanger = false;
bool gasAlertActive = false;

// Hysteresis
const int GAS_DANGER_ON_THRESHOLD = 400;
const int GAS_DANGER_OFF_THRESHOLD = 350;

// ======================
// Firebase Timing
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
// WATER SENSOR HELPERS
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
    ((float)(raw - DRY_VALUE) /
    (WET_VALUE - DRY_VALUE)) * 100.0;

  return constrain((int)percent, 0, 100);
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
  attachInterrupt(
    digitalPinToInterrupt(flowPin),
    pulseCounter,
    RISING
  );

  pinMode(WATER_SENSOR_PIN, INPUT);

  // GAS + SAFETY
  pinMode(GAS_SENSOR_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(RELAY_PIN, OUTPUT);

  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(RELAY_PIN, LOW);

  // ======================
  // WIFI
  // ======================
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting WiFi");

  unsigned long wifiStart = millis();

  while (
    WiFi.status() != WL_CONNECTED &&
    millis() - wifiStart < 20000
  ) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected");
  } else {
    Serial.println("\nWiFi Failed");
  }

  // ======================
  // FIREBASE
  // ======================
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  if (Firebase.signUp(&config, &auth, "", "")) {
    signupOK = true;
    Serial.println("Firebase Signup OK");
  } else {
    Serial.println(
      config.signer.signupError.message.c_str()
    );
  }

  config.token_status_callback = tokenStatusCallback;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

// ======================
// LED
// ======================
void updateLED() {

  if (!Firebase.ready() || !signupOK) return;

  if (millis() - lastLEDUpdate >= LED_POLL_INTERVAL) {

    lastLEDUpdate = millis();

    if (Firebase.RTDB.getBool(&fbdoLED, "/led")) {

      bool state = fbdoLED.boolData();

      if (state != lastKnownLedState) {

        lastKnownLedState = state;

        digitalWrite(
          ledPin,
          state ? HIGH : LOW
        );
      }

    } else {

      Serial.print("LED read failed: ");
      Serial.println(
        fbdoLED.errorReason()
      );
    }
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

    Serial.print("Flow: ");
    Serial.print(flowRate);
    Serial.print(" L/min | Delta: ");
    Serial.println(deltaLiters);
  }
}

// ======================
// WATER
// ======================
void updateWaterReading() {

  if (millis() - lastWaterRead >= WATER_INTERVAL) {

    lastWaterRead = millis();

    int raw = readWaterSensor();

    waterPercent =
      getWaterPercent(raw);

    Serial.print("Water Level: ");
    Serial.print(waterPercent);
    Serial.println("%");
  }
}

// ======================
// GAS + SAFETY
// ======================
void updateGasReading() {

  if (millis() - lastGasRead >= GAS_INTERVAL) {

    lastGasRead = millis();

    int raw = analogRead(GAS_SENSOR_PIN);

    // Demo-scaled gas level
    // Not calibrated MQ-2 ppm
    gasPpm = map(
      raw,
      0,
      4095,
      0,
      1000
    );

    Serial.print("Gas Level: ");
    Serial.println(gasPpm);

    // ======================
    // HYSTERESIS
    // ======================
    if (
      !gasDanger &&
      gasPpm > GAS_DANGER_ON_THRESHOLD
    ) {
      gasDanger = true;
      Serial.println(
        "Gas danger entered"
      );
    }

    if (
      gasDanger &&
      gasPpm < GAS_DANGER_OFF_THRESHOLD
    ) {
      gasDanger = false;
      Serial.println(
        "Gas level normal"
      );
    }

    // ======================
    // LOCAL SAFETY
    // ======================
    digitalWrite(
      BUZZER_PIN,
      gasDanger ? HIGH : LOW
    );

    digitalWrite(
      RELAY_PIN,
      gasDanger ? HIGH : LOW
    );

    Serial.print("Buzzer: ");
    Serial.println(
      gasDanger ? "ON" : "OFF"
    );

    Serial.print("Relay: ");
    Serial.println(
      gasDanger ? "ON" : "OFF"
    );

    // ======================
    // FIREBASE ALERT
    // ======================
    if (
      gasDanger &&
      !gasAlertActive &&
      Firebase.ready() &&
      signupOK
    ) {

      FirebaseJson alert;

      alert.set(
        "type",
        "danger"
      );

      alert.set(
        "title",
        "Gas Danger"
      );

      alert.set(
        "message",
        "Gas level exceeded safe threshold: " +
        String(gasPpm) +
        " ppm"
      );

      alert.set(
        "source",
        "gasSensor"
      );

      alert.set(
        "acknowledged",
        false
      );

      alert.set(
        "createdAt/.sv",
        "timestamp"
      );

      bool alertOk =
        Firebase.RTDB.pushJSON(
          &fbdo,
          "properties/" +
            propertyId +
            "/alerts",
          &alert
        );

      if (alertOk) {

        gasAlertActive = true;

        Serial.println(
          "Gas alert pushed"
        );

      } else {

        Serial.print(
          "Gas alert failed: "
        );

        Serial.println(
          fbdo.errorReason()
        );
      }
    }

    // Recovery reset
    if (!gasDanger) {
      gasAlertActive = false;
    }
  }
}

// ======================
// FIREBASE UPLOAD
// ======================
void uploadLatestTelemetry() {

  if (
    millis() -
    lastFirebaseUpload >=
    FIREBASE_INTERVAL
  ) {

    lastFirebaseUpload = millis();

    if (
      Firebase.ready() &&
      signupOK
    ) {

      FirebaseJson payload;

      payload.set(
        "flowRate",
        flowRate
      );

      payload.set(
        "totalLiters",
        totalLiters
      );

      payload.set(
        "waterLevel",
        waterPercent
      );

      payload.set(
        "gas",
        gasPpm
      );

      payload.set(
        "buzzerStatus",
        gasDanger
      );

      payload.set(
        "relayStatus",
        gasDanger
      );

      payload.set(
        "updatedAt/.sv",
        "timestamp"
      );

      bool latestOk =
        Firebase.RTDB.updateNode(
          &fbdo,
          basePath +
          "/latest",
          &payload
        );

      if (!latestOk) {

        Serial.print(
          "Latest update failed: "
        );

        Serial.println(
          fbdo.errorReason()
        );
      }

      // ======================
      // FLOW HISTORY
      // ======================
      if (flowRate > 0.0) {

        FirebaseJson history;

        history.set(
          "roomId",
          roomId
        );

        history.set(
          "flowRate",
          flowRate
        );

        history.set(
          "deltaLiters",
          pendingHistoryDeltaLiters
        );

        history.set(
          "totalLiters",
          totalLiters
        );

        history.set(
          "createdAt/.sv",
          "timestamp"
        );

        bool historyOk =
          Firebase.RTDB.pushJSON(
            &fbdo,
            "properties/" +
              propertyId +
              "/history",
            &history
          );

        if (historyOk) {

          pendingHistoryDeltaLiters = 0.0;

        } else {

          Serial.print(
            "History push failed: "
          );

          Serial.println(
            fbdo.errorReason()
          );
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
  updateGasReading();
  uploadLatestTelemetry();
}

