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
FirebaseAuth auth;
FirebaseConfig config;

bool signupOK = false;

// ======================
// Sensor Pin
// ======================
#define WATER_SENSOR_PIN 34   // ✅ stable ADC pin

// Firebase path
const char* firebasePath =
"/properties/property_001/rooms/room_001/latest/waterLevel";

// ======================
// 🔧 CALIBRATION VALUES (YOU CAN ADJUST)
// ======================
// Measure these using Serial Monitor
#define DRY_VALUE 1200   // sensor in air
#define WET_VALUE 1800   // sensor in water (IMPORTANT: adjust after testing)

// ======================
// Stable Reading Function
// ======================
int readWaterSensor() {

  long total = 0;

  for (int i = 0; i < 20; i++) {
    total += analogRead(WATER_SENSOR_PIN);
    delay(5);
  }

  return total / 20;
}

// ======================
// Convert to Percentage (FIXED)
// ======================
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

  pinMode(WATER_SENSOR_PIN, INPUT);

  // ======================
  // WiFi Connect
  // ======================
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
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
// Loop
// ======================
void loop() {

  int rawValue = readWaterSensor();
  int waterPercent = getWaterPercent(rawValue);

  Serial.print("Raw: ");
  Serial.print(rawValue);
  Serial.print(" | Water Level: ");
  Serial.print(waterPercent);
  Serial.println("%");

  if (Firebase.ready() && signupOK) {

    Firebase.RTDB.setInt(&fbdo, firebasePath, waterPercent);

    Serial.println("Firebase Updated");
  }

  delay(1000);
}