#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

// =====================================================================
// WiFi Credentials (Configure for your network)
// =====================================================================
#define WIFI_SSID "ESP32"
#define WIFI_PASSWORD "12345678"

// =====================================================================
// Firebase Credentials (Autodetected from your .env settings)
// =====================================================================
#define API_KEY "AIzaSyCO7vsvUvYaLI11r9wjztYuMIteG4AorrY"
#define DATABASE_URL "https://esp32led-b6105-c0b99-default-rtdb.asia-southeast1.firebasedatabase.app/"

// Firebase Objects
FirebaseData fbdo;
FirebaseData fbdoLED; // Dedicated data object for non-blocking LED reading
FirebaseAuth auth;
FirebaseConfig config;

// =====================================================================
// Device IDs & Path Alignment
// =====================================================================
String propertyId = "property_001";
String roomId = "room_001";
String basePath; // Handled in setup()

// =====================================================================
// LED / Actuator Configuration (Root "/led" Path Control)
// =====================================================================
const int ledPin = 2; // Built-in ESP32 LED (GPIO2)
bool signupOK = false;
unsigned long lastLEDUpdate = 0;
const unsigned long LED_POLL_INTERVAL = 1500; // Poll LED state every 1.5s
bool lastKnownLedState = false;

// =====================================================================
// Flow Sensor Configuration (YF-S402 or similar)
// =====================================================================
const int flowPin = 35; // Input pin for flow meter pulses
volatile int pulseCount = 0;

float flowRate = 0.0;
float totalLiters = 0.0;

unsigned long lastFlowUpdate = 0;
unsigned long lastFirebaseUpdate = 0;
const unsigned long FIREBASE_PUSH_INTERVAL = 3000; // Upload payload every 3s

// Calibration factor (pulses per Liter)
float calibrationFactor = 320.0;

// Interrupt Service Routine (ISR) - IRAM_ATTR places code in RAM for speed
void IRAM_ATTR pulseCounter() {
  pulseCount++;
}

// =====================================================================
// Setup
// =====================================================================
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n=============================================");
  Serial.println("   GREEN HOME HUB — Water Flow Monitor Node");
  Serial.println("=============================================");

  // Build target Firebase basePath (no leading slash to match green_home_node)
  basePath = "properties/" + propertyId + "/rooms/" + roomId;
  Serial.print("[Firebase] Targets base path: ");
  Serial.println(basePath);

  // Initialize LED indicator
  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, LOW);

  // Initialize Flow sensor interrupt
  pinMode(flowPin, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(flowPin), pulseCounter, RISING);
  Serial.println("[Hardware] Flow sensor interrupt attached to Pin 35");

  // Connect to WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("[WiFi] Connecting to network: ");
  Serial.println(WIFI_SSID);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\n[WiFi] ✓ Connected successfully!");
  Serial.print("[WiFi] IP Address: ");
  Serial.println(WiFi.localIP());

  // Configure Firebase parameters
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  Serial.println("[Firebase] Initializing client...");
  if (Firebase.signUp(&config, &auth, "", "")) {
    signupOK = true;
    Serial.println("[Firebase] ✓ Anonymous Authentication OK");
  } else {
    Serial.printf("[Firebase] ✗ Authentication Failed: %s\n", config.signer.signupError.message.c_str());
  }

  config.token_status_callback = tokenStatusCallback;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  Serial.println("[System] Ready and running flow calculations...");
}

// =====================================================================
// LED Control (Synchronized with Dashboard Root /led Control)
// =====================================================================
void updateLEDAndFirebase() {
  if (!Firebase.ready() || !signupOK) return;

  unsigned long currentTime = millis();
  if (currentTime - lastLEDUpdate >= LED_POLL_INTERVAL) {
    lastLEDUpdate = currentTime;

    // Fetch the "/led" value from the root path (controls the physical node's light)
    if (Firebase.RTDB.getBool(&fbdoLED, "/led")) {
      if (fbdoLED.dataType() == "boolean" || fbdoLED.dataType() == "integer") {
        bool serverLedState = fbdoLED.boolData();
        
        // Only update Pin and log if state changed to keep console clean
        if (serverLedState != lastKnownLedState) {
          lastKnownLedState = serverLedState;
          digitalWrite(ledPin, serverLedState ? HIGH : LOW);
          Serial.print("[Actuator] Dashboard LED state changed → ");
          Serial.println(serverLedState ? "HIGH (ON)" : "LOW (OFF)");
        }
      }
    } else {
      Serial.printf("[Firebase Error] LED Fetch failed: %s\n", fbdoLED.errorReason().c_str());
    }
  }
}

// =====================================================================
// Flow Sensor Calculations & Atomic Firebase Upload (Atomic JSON payload)
// =====================================================================
void updateFlowSensorAndFirebase() {
  unsigned long currentTime = millis();

  // 1. Calculate flow rate every 1 second (Non-blocking thread-safe copy)
  if (currentTime - lastFlowUpdate >= 1000) {
    lastFlowUpdate = currentTime;

    // Enter critical section to copy pulseCount safely without disabling pin interrupts
    noInterrupts();
    int pulses = pulseCount;
    pulseCount = 0;
    interrupts();

    // Mathematically correct flow rate calculation
    flowRate = ((pulses * 60.0) / calibrationFactor);
    totalLiters += (flowRate / 60.0);

    Serial.printf("[Telemetry] Live Flow: %.2f L/min | Total Consumption: %.2f L (Pulses: %d)\n", 
                  flowRate, totalLiters, pulses);
  }

  // 2. Upload atomic JSON package to Firebase every 3 seconds
  if (currentTime - lastFirebaseUpdate >= FIREBASE_PUSH_INTERVAL) {
    lastFirebaseUpdate = currentTime;

    if (Firebase.ready() && signupOK) {
      FirebaseJson payload;
      
      // Pack values inside JSON object matching schema definitions
      payload.set("flowRate", flowRate);
      payload.set("totalLiters", totalLiters);
      payload.set("updatedAt/.sv", "timestamp"); // Firebase Server-Side Epoch Timestamp

      Serial.println("[Firebase] Uploading atomic flow statistics payload...");
      if (Firebase.RTDB.updateNodeJSON(&fbdo, basePath + "/latest", &payload)) {
        Serial.println("[Firebase] ✓ Successfully updated 'flowRate', 'totalLiters', and 'updatedAt'");
      } else {
        Serial.printf("[Firebase] ✗ Update Failed: %s\n", fbdo.errorReason().c_str());
      }
    }
  }
}

// =====================================================================
// Main Loop
// =====================================================================
void loop() {
  updateLEDAndFirebase();
  updateFlowSensorAndFirebase();
  
  // Minimal non-blocking delay to keep the watchdog timer happy
  delay(10);
}