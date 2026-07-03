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
const int ledPin = 2;
const int extLedPin = 23;

// ======================
// LED STATE CONTROL
// ======================
unsigned long lastLEDUpdate = 0;
unsigned long lastHeartbeat = 0;
const unsigned long LED_POLL_INTERVAL = 1500;
bool lastKnownLedState = false;
bool wifiConnected = false;
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
unsigned long lastGasRead = 0;

// ======================
// PZEM DUMMY DATA
// ======================
float pzemVoltage = 216.0f;
float pzemCurrent = 0.0f;
float pzemPower = 0.0f;
float pzemEnergy = 0.0f;
unsigned long lastPzemRead = 0;
const unsigned long PZEM_INTERVAL = 3000;
float targetPowerW = 4.41f;
float targetVoltageV = 216.0f;

// ======================
// DOOR SENSOR
// ======================
#define DOOR_SWITCH_PIN 33

// ======================
// PIR SENSOR
// ======================
#define PIR_PIN 27

// ======================
// ULTRASONIC SENSOR
// ======================
#define ULTRASONIC_TRIG_PIN 18
#define ULTRASONIC_ECHO_PIN 19

// ======================
// SECOND RELAY
// ======================
#define RELAY_2_PIN 14

// ======================
// DHT11 SENSOR
// ======================
#define DHTPIN 4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);
float temperature = 0.0;
float humidity = 0.0;
unsigned long lastDHTRead = 0;
const unsigned long DHT_INTERVAL = 2000;

// ======================
// DOOR/PIR STATE VARIABLES
// ======================
bool doorAlertDone = false;
int lastDoorState = -1;
int lastPIRState = -1;
bool lastHumanDetected = false;
unsigned long lastHumanTime = 0;
bool relay2State = false;

// ======================
// DISTANCE VARIABLE
// ======================
float currentDistance = 0.0;
unsigned long lastDistanceRead = 0;
const unsigned long DISTANCE_INTERVAL = 500;

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
// HELPER FUNCTIONS
// ======================
void beep(int delayTime) {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(delayTime);
  digitalWrite(BUZZER_PIN, LOW);
}

float getDistance() {
  digitalWrite(ULTRASONIC_TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(ULTRASONIC_TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(ULTRASONIC_TRIG_PIN, LOW);

  long duration = pulseIn(ULTRASONIC_ECHO_PIN, HIGH, 30000);
  if (duration == 0) return 999;
  return duration * 0.0343 / 2;
}

// ======================
// UPDATE DHT11 READING
// ======================
void updateDHTReading() {
  if (millis() - lastDHTRead >= DHT_INTERVAL) {
    lastDHTRead = millis();

    float newHumidity = dht.readHumidity();
    float newTemperature = dht.readTemperature();

    if (isnan(newHumidity) || isnan(newTemperature)) {
      Serial.println("DHT11 Read Failed");
      return;
    }

    humidity = newHumidity;
    temperature = newTemperature;
  }
}

// ======================
// UPDATE PZEM DUMMY READING
// ======================
void updatePzemDummyReading() {
  if (millis() - lastPzemRead >= PZEM_INTERVAL) {
    lastPzemRead = millis();

    float smoothWave = (sin(millis() * 0.00012f) + 1.0f) * 0.5f;

    targetVoltageV = 216.0f + (smoothWave * 14.0f);
    targetPowerW = 4.41f + (smoothWave * 0.59f);

    pzemVoltage = targetVoltageV;
    pzemPower = targetPowerW;
    pzemCurrent = pzemPower / pzemVoltage;

    pzemEnergy += pzemPower * (PZEM_INTERVAL / 3600000.0f);
  }
}

// ======================
// UPDATE DISTANCE READING
// ======================
void updateDistanceReading() {
  if (millis() - lastDistanceRead >= DISTANCE_INTERVAL) {
    lastDistanceRead = millis();
    currentDistance = getDistance();
  }
}

// ======================
// LED EFFECTS
// ======================
void wifiConnectingBlink() {
  digitalWrite(extLedPin, HIGH);
  delay(100);
  digitalWrite(extLedPin, LOW);
  delay(100);
}

void wifiConnectedBreathing() {
  float wave = (sin(millis() * 0.002) + 1.0) / 2.0;
  int brightness = wave * 255;
  analogWrite(extLedPin, brightness);
}

void firebaseBlinkPulse() {
  digitalWrite(extLedPin, HIGH);
  delay(50);
  digitalWrite(extLedPin, LOW);
}

void systemHeartbeat() {
  if (millis() - lastHeartbeat > 5000) {
    lastHeartbeat = millis();
    digitalWrite(extLedPin, HIGH);
    delay(80);
    digitalWrite(extLedPin, LOW);
  }
}

// ======================
// FLOW SENSOR
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
// WATER SENSOR
// ======================
void updateWaterReading() {
  if (millis() - lastWaterRead >= WATER_INTERVAL) {
    lastWaterRead = millis();
    int raw = analogRead(WATER_SENSOR_PIN);
    waterPercent = map(raw, DRY_VALUE, WET_VALUE, 0, 100);
    waterPercent = constrain(waterPercent, 0, 100);
  }
}

// ======================
// GAS SENSOR
// ======================
void updateGasReading() {
  if (millis() - lastGasRead >= GAS_INTERVAL) {
    lastGasRead = millis();

    int raw = analogRead(GAS_SENSOR_PIN);
    gasPpm = map(raw, 0, 4095, 0, 1000);

    if (gasPpm > 300) {
      digitalWrite(RELAY_PIN, HIGH);
      digitalWrite(BUZZER_PIN, HIGH);
      delay(200);
      digitalWrite(BUZZER_PIN, LOW);
      delay(200);
      digitalWrite(BUZZER_PIN, HIGH);
      delay(200);
      digitalWrite(BUZZER_PIN, LOW);
    } else {
      digitalWrite(BUZZER_PIN, LOW);
      digitalWrite(RELAY_PIN, LOW);
    }
  }
}

// ======================
// DOOR SENSOR
// ======================
void updateDoorReading() {
  int doorState = digitalRead(DOOR_SWITCH_PIN);

  if (doorState != lastDoorState) {
    if (doorState == 0 && !doorAlertDone) {
      beep(300);
      doorAlertDone = true;
    }

    if (doorState == 1) {
      doorAlertDone = false;
    }

    lastDoorState = doorState;
  }
}

// ======================
// PIR SENSOR
// ======================
void updatePIRReading() {
  int pirState = digitalRead(PIR_PIN);

  if (pirState != lastPIRState) {
    if (pirState == 1) {
      beep(120);
    }
    lastPIRState = pirState;
  }
}

// ======================
// ULTRASONIC & RELAY LOGIC
// ======================
void updateHumanDetection() {
  int pirState = digitalRead(PIR_PIN);
  bool humanDetected = (currentDistance <= 50) || (pirState == 1);

  if (humanDetected != lastHumanDetected) {
    if (humanDetected) {
      beep(200);
    }
    lastHumanDetected = humanDetected;
  }

  if (humanDetected) {
    lastHumanTime = millis();
    if (!relay2State) {
      relay2State = true;
      digitalWrite(RELAY_2_PIN, HIGH);
    }
  }

  if (relay2State && (millis() - lastHumanTime > 5000)) {
    relay2State = false;
    digitalWrite(RELAY_2_PIN, LOW);
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
      payload.set("doorState", lastDoorState);
      payload.set("motionDetected", lastPIRState);
      payload.set("humanPresent", lastHumanDetected);
      payload.set("distance", currentDistance);
      payload.set("temperature", temperature);
      payload.set("humidity", humidity);
      payload.set("voltage", pzemVoltage);
      payload.set("current", pzemCurrent);
      payload.set("power", pzemPower);
      payload.set("energy", pzemEnergy);
      payload.set("updatedAt/.sv", "timestamp");

      if (currentDistance <= 50) {
        payload.set("proximityStatus", "CLOSE");
      } else if (currentDistance <= 100) {
        payload.set("proximityStatus", "NEAR");
      } else if (currentDistance <= 200) {
        payload.set("proximityStatus", "FAR");
      } else {
        payload.set("proximityStatus", "OUT_OF_RANGE");
      }

      if (temperature < 18) {
        payload.set("temperatureStatus", "COLD");
      } else if (temperature <= 30) {
        payload.set("temperatureStatus", "COMFORTABLE");
      } else if (temperature <= 35) {
        payload.set("temperatureStatus", "WARM");
      } else {
        payload.set("temperatureStatus", "HOT");
      }

      if (humidity < 30) {
        payload.set("humidityStatus", "DRY");
      } else if (humidity <= 60) {
        payload.set("humidityStatus", "COMFORTABLE");
      } else if (humidity <= 80) {
        payload.set("humidityStatus", "HUMID");
      } else {
        payload.set("humidityStatus", "VERY_HUMID");
      }

      bool success = Firebase.RTDB.updateNode(&fbdo, basePath + "/latest", &payload);

      if (success) {
        firebaseBlinkPulse();
      }

      if (flowRate > 0.0) {
        FirebaseJson history;
        history.set("roomId", roomId);
        history.set("flowRate", flowRate);
        history.set("deltaLiters", pendingHistoryDeltaLiters);
        history.set("totalLiters", totalLiters);
        history.set("temperature", temperature);
        history.set("humidity", humidity);
        history.set("createdAt/.sv", "timestamp");

        bool ok = Firebase.RTDB.pushJSON(&fbdo, "properties/" + propertyId + "/history", &history);
        if (ok) {
          pendingHistoryDeltaLiters = 0.0;
        }
      }
    }
  }
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
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(RELAY_PIN, LOW);

  pinMode(DOOR_SWITCH_PIN, INPUT);
  pinMode(PIR_PIN, INPUT);

  pinMode(ULTRASONIC_TRIG_PIN, OUTPUT);
  pinMode(ULTRASONIC_ECHO_PIN, INPUT);

  pinMode(RELAY_2_PIN, OUTPUT);
  digitalWrite(RELAY_2_PIN, LOW);

  pinMode(DHTPIN, INPUT_PULLUP);
  dht.begin();

  targetVoltageV = 216.0f;
  targetPowerW = 4.41f;
  pzemVoltage = targetVoltageV;
  pzemPower = targetPowerW;
  pzemCurrent = pzemPower / pzemVoltage;
  pzemEnergy = 0.0f;

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long wifiStart = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - wifiStart < 20000) {
    wifiConnectingBlink();
    delay(100);
  }

  wifiConnected = (WiFi.status() == WL_CONNECTED);

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
// LOOP
// ======================
void loop() {
  updateFlowReading();
  updateWaterReading();
  updateGasReading();
  updateDHTReading();
  updatePzemDummyReading();
  updateDistanceReading();
  updateDoorReading();
  updatePIRReading();
  updateHumanDetection();

  uploadLatestTelemetry();

  if (!wifiConnected) {
    wifiConnectingBlink();
  } else if (Firebase.ready() && signupOK) {
    wifiConnectedBreathing();
  }

  systemHeartbeat();
  delay(50);
}