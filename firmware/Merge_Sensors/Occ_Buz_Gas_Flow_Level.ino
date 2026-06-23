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
// DOOR/PIR STATE VARIABLES
// ======================
bool doorAlertDone = false;
int lastDoorState = -1;
int lastPIRState = -1;
bool lastHumanDetected = false;

// relay timing control
unsigned long lastHumanTime = 0;
bool relay2State = false;

// Firebase tracking for occupancy
unsigned long lastOccupancyUpload = 0;
const unsigned long OCCUPANCY_UPLOAD_INTERVAL = 5000;  // Log occupancy changes every 5 seconds

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
// ======================
// TOKEN STATUS CALLBACK
// ======================
void tokenStatusCallback(status_info_t info) {
  if (info.status == token_status_ready) {
    Serial.println("\n✓ Firebase Auth Token Ready!");
  } else if (info.status == token_status_expired) {
    Serial.println("\n✗ Firebase Auth Token Expired!");
  } else if (info.status == token_status_error) {
    Serial.println("\n✗ Firebase Auth Token Error!");
  }
}

// ======================
// BEEP HELPER
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
  // Only process if state changed OR if it's the first read (lastDoorState == -1)
  if (doorState != lastDoorState) {
    if (lastDoorState != -1) {  // Skip alert on first read
      Serial.print("DOOR STATE CHANGED: ");
      Serial.println(doorState ? "CLOSED" : "OPEN");
      
      if (doorState == 0 && !doorAlertDone) {
        Serial.println("⚠️ DOOR OPEN ALERT");
        beep(300);
        doorAlertDone = true;
      }
      
      if (doorState == 1) {
        Serial.println("DOOR CLOSED");
        doorAlertDone = false;
      }
    } else {
      Serial.print("INITIAL DOOR STATE: ");
      Serial.println(doorState ? "CLOSED" : "OPEN")
void updateDoorReading() {
  int doorState = digitalRead(DOOR_SWITCH_PIN);
  
  if (doorState != lastDoorState) {
    Serial.print("DOOR STATE: ");
    Serial.println(doorState ? "CLOSED" : "OPEN");
    
    if (doorState == 0 && !doorAlertDone) {
      Serial.println("⚠️ DOOR OPEN ALERT");
      beep(300);
      doorAlertDone = true;
    }
    
    if (doorState == 1) {
      Serial.println("DOOR CLOSED");
      doorAlertDone = false;
    }
    
    lastDoorState = doorState;
  }
}

// ======================
// PIR SlastPIRState != -1) {  // Skip on first read
      if (pirState == 1) {
        Serial.println("🔴 MOTION DETECTED");
        beep(120);
      } else {
        Serial.println("👁️ NO MOTION");
      }
    } else {
      Serial.print("INITIAL PIR STATE: ");
      Serial.println(pirState ? "MOTION" : "NO MOTION"Reading() {
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
  float distance = getDistance();
  int pirState = digitalRead(PIR_PIN);
  bool humanDetected = (distance <= 50) || (pirState == 1);
  
  // Log human detection changes
  if (humanDetected != lastHumanDetected) {
    if (humanDetected) {
      Serial.print("👤 HUMAN DETECTED - DIST: ");
      Serial.println(distance);
      beep(200);
    } else {
      Serial.println(" AREA CLEAR");
    }
    lastHumanDetected = humanDetected;
  }
  
  // Control relay based on human presence
  if (humanDetected) {
    lastHumanTime = millis();
    if (!relay2State) {
      relay2State = true;
      digitalWrite(RELAY_2_PIN, HIGH);
   UPLOAD OCCUPANCY EVENTS
// ======================
void uploadOccupancyEvent(const char* eventType, int eventValue) {
  if (Firebase.ready() && signupOK) {
    FirebaseJson occupancyEvent;
    occupancyEvent.set("roomId", roomId);
    occupancyEvent.set("eventType", eventType);
    occupancyEvent.set("eventValue", eventValue);
    occupancyEvent.set("timestamp/.sv", "timestamp");
    
    String occupancyPath = "properties/" + propertyId + "/occupancy/events";
    
    bool success = Firebase.RTDB.pushJSON(&fbdo, occupancyPath, &occupancyEvent);
    
    if (success) {
      Serial.printf("✓ Occupancy event uploaded: %s = %d\n", eventType, eventValue);
    } else {
      Serial.printf("✗ Failed to upload occupancy event: %s\n", fbdo.errorReason().c_str());
    }
  }
}

// ======================
// OCCUPANCY STATE CALCULATION
// ======================
String calculateOccupancyState() {
  // Determine room occupancy based on sensor readings
  // Priority: Human presence > Motion > Door state
  
  if (lastHumanDetected || (lastPIRState == 1)) {
    // Human is actively present or motion detected
    return "OCCUPIED_ACTIVE";
  } else if (lastDoorState == 0) {
    // Door is open but no human detected
    return "OCCUPIED_IDLE";
  } else {
    // No activity, door closed
    return "VACANT";
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
      payload.set("motionDetected", lastPIRState == 1 ? true : false);
      payload.set("humanPresent", lastHumanDetected);
      payload.set("relayActive", relay2State);
      payload.set("occupancyState", calculateOccupancyState());
      payload.set("updatedAt/.sv", "timestamp");
      
      bool updateSuccess = Firebase.RTDB.updateNode(&fbdo, basePath + "/latest", &payload);
      
      if (updateSuccess) {
        firebaseBlinkPulse();
        Serial.println("✓ Telemetry updated to Firebase");
      } else {
        Serial.printf("✗ Telemetry update failed: %s\n", fbdo.errorReason().c_str());
      }
      
      // Upload flow history if there's flow
      if (flowRate > 0.0) {
        FirebaseJson history;
        history.set("roomId", roomId);
        history.set("flowRate", flowRate);
  Serial.println("\n\n=== SMART HOTEL SYSTEM INITIALIZING ===\n");
  
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
  analogSetPinAttenuation(GAS_SENSOR_PIN, ADC_11db);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(RELAY_PIN, LOW);
  
  // Door sensor
  pinMode(DOOR_SWITCH_PIN, INPUT_PULLUP);
  
  // PIR sensor
  pinMode(PIR_PIN, INPUT);
  
  // Ultrasonic sensor
  pinMode(ULTRASONIC_TRIG_PIN, OUTPUT);
  pinMode(ULTRASONIC_ECHO_PIN, INPUT);
  
  // Second relay
  pinMode(RELAY_2_PIN, OUTPUT);
  digitalWrite(RELAY_2_PIN, LOW);
  
  // ======================
  // INITIALIZE SENSOR STATES
  // ======================
  delay(500);  // Allow sensors to stabilize
  
  // Read initial states
  lastDoorState = digitalRead(DOOR_SWITCH_PIN);
  lastPIRState = digitalRead(PIR_PIN);
  
  Serial.printf("Initial door state: %d (0=OPEN, 1=CLOSED)\n", lastDoorState);
  Serial.printf("Initial PIR state: %d (0=NO MOTION, 1=MOTION)\n", lastPIRState);
  
  // ======================
  // WiFi CONNECTION
  // ======================
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("\nConnecting WiFi");
  
  unsigned long wifiStart = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - wifiStart < 20000) {
    wifiConnectingBlink();
    Serial.print(".");
  }
  
  wifiConnected = (WiFi.status() == WL_CONNECTED);
  Serial.println(wifiConnected ? "\n✓ WiFi Connected" : "\n✗ WiFi Failed");
  
  if (wifiConnected) {
    Serial.printf("IP Address: %s\n", WiFi.localIP().toString().c_str());
  }
  
  // ======================
  // FIREBASE SETUP
  // ======================
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  
  if (Firebase.signUp(&config, &auth, "", "")) {
    signupOK = true;
    Serial.println("✓ Firebase Signup OK");
  } else {
    Serial.printf("✗ Firebase Signup Failed: %s\n", config.signer.signupError.message.c_str());
  }
  
  config.token_status
  uploadLatestTelemetry();
  
  // Track occupancy changes and send to separate collection
  if (millis() - lastOccupancyUpload >= OCCUPANCY_UPLOAD_INTERVAL) {
    if (lastDoorState != -1) {  // Only after initial read
      uploadOccupancyEvent("door", lastDoorState);
    }
    if (lastPIRState != -1) {   // Only after initial read
      uploadOccupancyEvent("motion", lastPIRState);
    }
    lastOccupancyUpload = millis();
  }&auth);
  Firebase.reconnectWiFi(true);
  
  Serial.println("\n=== Smart Hotel System Ready! ===\n
  
  // Second relay
  pinMode(RELAY_2_PIN, OUTPUT);
  digitalWrite(RELAY_2_PIN, LOW);
  
  // ======================
  // WiFi CONNECTION
  // ======================
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting WiFi");
  
  unsigned long wifiStart = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - wifiStart < 20000) {
    wifiConnectingBlink();
    Serial.print(".");
  }
  
  wifiConnected = (WiFi.status() == WL_CONNECTED);
  Serial.println(wifiConnected ? "\n WiFi Connected" : "\n WiFi Failed");
  
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
}

// ======================
// LOOP
// ======================
void loop() {
  // Sensor readings
  updateFlowReading();
  updateWaterReading();
  updateGasReading();
  updateDoorReading();
  updatePIRReading();
  updateHumanDetection();
  
  // Firebase upload
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
  delay(100);
}