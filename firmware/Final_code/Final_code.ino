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
const int ledPin = 2;      // internal LED
const int extLedPin = 23;  // external status LED

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
const int RELAY_PIN = 26;  // First relay for gas

int gasPpm = 0;
unsigned long lastGasRead = 0;

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
const unsigned long DHT_INTERVAL = 2000; // Read DHT every 2 seconds

// ======================
// DOOR/PIR STATE VARIABLES
// ======================
bool doorAlertDone = false;
int lastDoorState = -1;
int lastPIRState = -1;
bool lastHumanDetected = false;

// relay timing control
unsigned long lastHumanTime = 0;
bool relay2State = false;

// ======================
// DISTANCE VARIABLE
// ======================
float currentDistance = 0.0;
unsigned long lastDistanceRead = 0;
const unsigned long DISTANCE_INTERVAL = 500; // Read distance every 500ms

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
      Serial.println("❌ DHT11 Read Failed");
      return;
    }
    
    humidity = newHumidity;
    temperature = newTemperature;
    
    Serial.print("🌡️ Temperature: ");
    Serial.print(temperature);
    Serial.print(" °C  💧 Humidity: ");
    Serial.print(humidity);
    Serial.println(" %");
    
    // Check for extreme conditions
    if (temperature > 40) {
      Serial.println("⚠️ HIGH TEMPERATURE ALERT!");
      beep(100);
    }
    
    if (humidity > 80) {
      Serial.println("⚠️ HIGH HUMIDITY ALERT!");
      beep(100);
    }
  }
}

// ======================
// UPDATE DISTANCE READING
// ======================
void updateDistanceReading() {
  if (millis() - lastDistanceRead >= DISTANCE_INTERVAL) {
    lastDistanceRead = millis();
    currentDistance = getDistance();
    
    // Print distance for debugging
    if (currentDistance <= 200) { // Only print if within 2 meters
      Serial.print("📏 Distance: ");
      Serial.print(currentDistance);
      Serial.println(" cm");
    }
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
    Serial.print("🚪 DOOR STATE: ");
    Serial.println(doorState ? "CLOSED" : "OPEN");
    
    if (doorState == 0 && !doorAlertDone) {
      Serial.println("⚠️ DOOR OPEN ALERT");
      beep(300);
      doorAlertDone = true;
    }
    
    if (doorState == 1) {
      Serial.println("✅ DOOR CLOSED");
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
      Serial.println("🔴 MOTION DETECTED");
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
  
  // Log human detection changes
  if (humanDetected != lastHumanDetected) {
    if (humanDetected) {
      Serial.print("👤 HUMAN DETECTED - DIST: ");
      Serial.print(currentDistance);
      Serial.println(" cm");
      beep(200);
    } else {
      Serial.println("✅ AREA CLEAR");
    }
    lastHumanDetected = humanDetected;
  }
  
  // Control relay based on human presence
  if (humanDetected) {
    lastHumanTime = millis();
    if (!relay2State) {
      relay2State = true;
      digitalWrite(RELAY_2_PIN, HIGH);
      Serial.println("🔌 RELAY 2 ON (Human presence)");
    }
  }
  
  // Turn off relay after 5 seconds of no detection
  if (relay2State && (millis() - lastHumanTime > 5000)) {
    relay2State = false;
    digitalWrite(RELAY_2_PIN, LOW);
    Serial.println("🔌 RELAY 2 OFF (No presence)");
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
      
      // Water sensors
      payload.set("flowRate", flowRate);
      payload.set("totalLiters", totalLiters);
      payload.set("waterLevel", waterPercent);
      
      // Gas sensor
      payload.set("gas", gasPpm);
      
      // Door and security sensors
      payload.set("doorState", lastDoorState);
      payload.set("motionDetected", lastPIRState);
      payload.set("humanPresent", lastHumanDetected);
      
      // Distance measurement
      payload.set("distance", currentDistance);
      if (currentDistance <= 50) {
        payload.set("proximityStatus", "CLOSE");
      } else if (currentDistance <= 100) {
        payload.set("proximityStatus", "NEAR");
      } else if (currentDistance <= 200) {
        payload.set("proximityStatus", "FAR");
      } else {
        payload.set("proximityStatus", "OUT_OF_RANGE");
      }
      
      // DHT11 Temperature and Humidity
      payload.set("temperature", temperature);
      payload.set("humidity", humidity);
      
      // Add temperature status
      if (temperature < 18) {
        payload.set("temperatureStatus", "COLD");
      } else if (temperature >= 18 && temperature <= 30) {
        payload.set("temperatureStatus", "COMFORTABLE");
      } else if (temperature > 30 && temperature <= 35) {
        payload.set("temperatureStatus", "WARM");
      } else {
        payload.set("temperatureStatus", "HOT");
      }
      
      // Add humidity status
      if (humidity < 30) {
        payload.set("humidityStatus", "DRY");
      } else if (humidity >= 30 && humidity <= 60) {
        payload.set("humidityStatus", "COMFORTABLE");
      } else if (humidity > 60 && humidity <= 80) {
        payload.set("humidityStatus", "HUMID");
      } else {
        payload.set("humidityStatus", "VERY_HUMID");
      }
      
      payload.set("updatedAt/.sv", "timestamp");
      
      // Update to Firebase
      bool success = Firebase.RTDB.updateNode(&fbdo, basePath + "/latest", &payload);
      
      if (success) {
        Serial.println("✅ Data uploaded to Firebase");
        Serial.printf("   - Temperature: %.1f °C\n", temperature);
        Serial.printf("   - Humidity: %.1f %%\n", humidity);
        Serial.printf("   - Distance: %.1f cm\n", currentDistance);
        firebaseBlinkPulse();
      } else {
        Serial.print("❌ Firebase upload failed: ");
        Serial.println(fbdo.errorReason());
      }
      
      // Upload flow history if water is flowing
      if (flowRate > 0.0) {
        FirebaseJson history;
        history.set("roomId", roomId);
        history.set("flowRate", flowRate);
        history.set("deltaLiters", pendingHistoryDeltaLiters);
        history.set("totalLiters", totalLiters);
        history.set("temperature", temperature);
        history.set("humidity", humidity);
        history.set("createdAt/.sv", "timestamp");
        
        bool ok = Firebase.RTDB.pushJSON(
          &fbdo,
          "properties/" + propertyId + "/history",
          &history);
        
        if (ok) {
          pendingHistoryDeltaLiters = 0.0;
          Serial.println("✅ Flow history uploaded");
        }
      }
    } else {
      Serial.println("⚠️ Firebase not ready");
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
  
  // LED pins
  pinMode(ledPin, OUTPUT);
  pinMode(extLedPin, OUTPUT);
  digitalWrite(ledPin, LOW);
  digitalWrite(extLedPin, LOW); 
  
  // Flow sensor
  pinMode(flowPin, INPUT);
  attachInterrupt(digitalPinToInterrupt(flowPin), pulseCounter, RISING);
  
  // Water sensor
  pinMode(WATER_SENSOR_PIN, INPUT);
  
  // Gas sensor and actuators
  pinMode(GAS_SENSOR_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(RELAY_PIN, LOW);
  
  // Door sensor
  pinMode(DOOR_SWITCH_PIN, INPUT);
  
  // PIR sensor
  pinMode(PIR_PIN, INPUT);
  
  // Ultrasonic sensor
  pinMode(ULTRASONIC_TRIG_PIN, OUTPUT);
  pinMode(ULTRASONIC_ECHO_PIN, INPUT);
  
  // Second relay
  pinMode(RELAY_2_PIN, OUTPUT);
  digitalWrite(RELAY_2_PIN, LOW);
  
  // DHT11 sensor
  pinMode(DHTPIN, INPUT_PULLUP);
  dht.begin();
  Serial.println(" DHT11 Sensor Started");
  
  // ======================
  // WiFi CONNECTION
  // ======================
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print(" Connecting WiFi");
  
  unsigned long wifiStart = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - wifiStart < 20000) {
    wifiConnectingBlink();
    Serial.print(".");
    delay(100);
  }
  
  wifiConnected = (WiFi.status() == WL_CONNECTED);
  Serial.println(wifiConnected ? "\n WiFi Connected" : "\n❌ WiFi Failed");
  
  if (wifiConnected) {
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  }
  
  // ======================
  // FIREBASE SETUP
  // ======================
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  
  if (Firebase.signUp(&config, &auth, "", "")) {
    signupOK = true;
    Serial.println(" Firebase Signup OK");
  } else {
    Serial.printf(" Firebase Signup Failed: %s\n", config.signer.signupError.message.c_str());
  }
  
  config.token_status_callback = tokenStatusCallback;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  
  Serial.println("\n Smart Hotel System Ready!");
  Serial.println("=================================");
  Serial.println(" Monitoring:");
  Serial.println("  - Water Flow Rate");
  Serial.println("  - Water Level");
  Serial.println("  - Gas Leakage");
  Serial.println("  - Door Status");
  Serial.println("  - Motion Detection");
  Serial.println("  - Distance Measurement");
  Serial.println("  - Human Presence");
  Serial.println("  - Temperature & Humidity (DHT11)");
  Serial.println("=================================\n");
}

// ======================
// LOOP
// ======================
void loop() {
  // Update all sensor readings
  updateFlowReading();      // Water flow every 1 second
  updateWaterReading();     // Water level every 1 second
  updateGasReading();       // Gas level every 1 second
  updateDHTReading();       // Temperature & Humidity every 2 seconds
  updateDistanceReading();  // Distance every 500ms
  updateDoorReading();      // Door state on change
  updatePIRReading();       // Motion on change
  updateHumanDetection();   // Human presence logic
  
  // Upload to Firebase every 3 seconds
  uploadLatestTelemetry();
  
  // ======================
  // STATUS LED CONTROLLER
  // ======================
  if (!wifiConnected) {
    wifiConnectingBlink();
  } else if (Firebase.ready() && signupOK) {
    wifiConnectedBreathing();
  }
  
  systemHeartbeat();
  
  // Small delay to prevent overwhelming the system
  delay(50);
}