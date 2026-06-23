# Firebase Sensor Configuration Guide
**Green Home Hub - IoT Sensor Integration**

**Last Updated:** June 2026  
**Project:** Green Home Hub (Tourist Accommodation Energy Management)  
**Hardware:** ESP32 with Multiple Sensors  

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Firebase Console Setup](#firebase-console-setup)
3. [Arduino/ESP32 Configuration](#arduinoesp32-configuration)
4. [Sensor-Specific Setup](#sensor-specific-setup)
5. [Testing & Validation](#testing--validation)
6. [Troubleshooting](#troubleshooting)
7. [Database Structure Reference](#database-structure-reference)

---

## Prerequisites

### Hardware Requirements
- **ESP32 Development Board** (WROOM-32 or similar)
- **Sensors:** (See [Sensor-Specific Setup](#sensor-specific-setup))
  - PZEM-004T (Energy meter)
  - MQ-2 (Gas sensor)
  - DHT22 (Temperature & Humidity)
  - PIR (Motion detector)
  - Reed Switch (Door/window sensor)
- **Relay Module** (3-channel or similar)
- **USB cable** (for programming)
- **WiFi network** (2.4GHz recommended)

### Software Requirements
- Arduino IDE 1.8.19 or later
- VS Code with Vite (for frontend)
- Node.js & npm
- Git (optional)

### Firebase Requirements
- Google account
- Firebase project created (free tier works for development)
- Access to Firebase Console

### Browser/IDE Extensions
- Firebase Console access
- Serial Monitor (built-in to Arduino IDE)
- REST API client (Postman, Insomnia, or browser DevTools)

---

## Firebase Console Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"+ Add project"**
3. **Project name:** `green-home-hub` (or your choice)
4. Accept the terms and click **"Create project"**
5. Wait for project creation to complete

### Step 2: Create Realtime Database

1. In Firebase Console, click **"Realtime Database"** (left sidebar)
2. Click **"Create Database"**
3. **Security rules:** Select **"Start in test mode"** (for development)
   - ⚠️ **WARNING:** Test mode allows anyone to read/write. Lock down before production.
4. **Database location:** Choose region closest to you
5. Click **"Enable"**

**Test Mode Security Rule:**
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

### Step 3: Create Service Account & Keys

1. Click **⚙️ Project Settings** (top-left gear icon)
2. Go to **"Service Accounts"** tab
3. Click **"Generate New Private Key"**
4. JSON file downloads automatically - **save it securely**

### Step 4: Get Web SDK Credentials

1. In Project Settings, go to **"General"** tab
2. Scroll to **"Your apps"** section
3. Click **"</>Web"** icon to add a web app
4. **App name:** `green-home-hub-frontend`
5. Copy the **firebaseConfig** object - you'll need this for `.env`

### Step 5: Create Database Structure

1. In Realtime Database, click **"⋮ Menu"** → **"Import JSON"**
2. Use the template structure below or import this JSON:

```json
{
  "properties": {
    "property_001": {
      "rooms": {
        "room_001": {
          "latest": {
            "voltage": 230,
            "current": 0,
            "power": 0,
            "energy": 0,
            "gas": 0,
            "pir": false,
            "doorOpen": false,
            "temperature": 20,
            "humidity": 50,
            "lightLevel": 0,
            "waterLevel": 75,
            "flowRate": 0,
            "totalLiters": 0,
            "motionDetected": false,
            "humanPresent": false,
            "relayActive": false,
            "occupancyState": "VACANT",
            "updatedAt": 0
          },
          "devices": {
            "lights": false,
            "waterPump": false,
            "exhaustFan": false,
            "motionDetection": true,
            "mainRelay": false,
            "buzzer": false,
            "updatedAt": 0
          },
          "alerts": {}
        }
      }
    }
  }
}
```

---

## Arduino/ESP32 Configuration

### Step 1: Install Required Libraries

1. Open **Arduino IDE**
2. Go to **Sketch** → **Include Library** → **Manage Libraries**
3. Search and install:

| Library | Author | Version |
|---------|--------|---------|
| Firebase ESP Client | Mobizt | Latest |
| PZEM004Tv30 | Jacobus | Latest |
| DHT sensor library | Adafruit | Latest |
| Adafruit Unified Sensor | Adafruit | Latest |
| WiFiManager | tzapu | Latest |
| ArduinoJson | Benoit Blanchon | v6.x |

**Installation Steps:**
- Search each name in Library Manager
- Click **Install**
- Wait for completion
- Repeat for all libraries

### Step 2: Update `.env` File

Create or update **`.env`** file in project root:

```env
# Firebase Web SDK Configuration
VITE_FIREBASE_API_KEY=YOUR_API_KEY_HERE
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Arduino/ESP32 Configuration
ARDUINO_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
ARDUINO_DATABASE_URL=https://your-project.firebasedatabase.app
```

**Where to get these values:**
1. **VITE_FIREBASE_*** → Firebase Console → Project Settings → General → firebaseConfig
2. **ARDUINO_FIREBASE_API_KEY** → Same as `VITE_FIREBASE_API_KEY`
3. **ARDUINO_DATABASE_URL** → Same as `VITE_FIREBASE_DATABASE_URL`

### Step 3: Configure Arduino Sketch

1. Open `firmware/green_home_node/green_home_node.ino`
2. Update configuration section (around line 40-80):

```cpp
// Firebase credentials (from your Firebase Console)
#define FIREBASE_API_KEY      "YOUR_FIREBASE_API_KEY"
#define FIREBASE_DATABASE_URL "https://YOUR_PROJECT.firebasedatabase.app"

// Property and Room identifiers
#define PROPERTY_ID   "property_001"
#define ROOM_ID       "room_001"
```

3. **Verify pin definitions** match your wiring:
   - Check the `PIN DEFINITIONS` section (lines 50-70)
   - Adjust if your wiring differs

### Step 4: Configure WiFi Credentials

There are **two methods**:

**Method A: Hardcoded (Development Only)**
```cpp
#define WIFI_SSID     "YOUR_WIFI_NAME"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
```

**Method B: Captive Portal (Recommended)**
- ESP32 creates a WiFi hotspot on first boot
- Connect to `ESP32-AP` and enter credentials via web page
- Check sketch for `WiFiManager` setup

### Step 5: Upload Sketch to ESP32

1. **Connect ESP32** via USB
2. **Select Board:**
   - Arduino IDE → Tools → Board → ESP32 → WROOM-32
3. **Select Port:**
   - Tools → Port → `/dev/ttyUSB0` (Linux/Mac) or `COM3` (Windows)
4. **Upload:**
   - Sketch → Upload
   - Or press **Ctrl+U** (Windows/Linux) / **Cmd+U** (Mac)
5. **Monitor Serial Output:**
   - Tools → Serial Monitor
   - Set baud rate to **115200**
   - Watch for connection messages

**Expected Serial Output:**
```
═══════════════════════════════════════
  GREEN HOME HUB — ESP32 Node v1.0
═══════════════════════════════════════

🔄 Connecting to WiFi...
✓ WiFi connected: [SSID]
🔄 Connecting to Firebase...
✓ Firebase connected
📡 Sensor readings: T=22.5°C, H=55%
✓ Data pushed to Firebase
```

---

## Sensor-Specific Setup

### 1. Gas Sensor (MQ-2)

**Purpose:** Detect hazardous gas concentration (ppm)

**Pin:** GPIO34 (Analog ADC1_CH6)

**Wiring:**
```
MQ-2 VCC → ESP32 3.3V
MQ-2 GND → ESP32 GND
MQ-2 AO  → ESP32 GPIO34
MQ-2 DO  → (Not used in this setup)
```

**Calibration:**
1. Power on the sensor
2. Let it warm up for **5-10 minutes** in fresh air
3. In Arduino sketch, note the baseline ADC reading:
```cpp
// In setup() or during first reads
int gasBaseline = analogRead(GAS_PIN);  // Should be ~100-200 in fresh air
Serial.println(gasBaseline);
```

4. Update thresholds in sketch (lines 80-85):
```cpp
#define GAS_DANGER_THRESHOLD   800   // ADC value (0-4095)
#define GAS_WARNING_THRESHOLD  500
```

**Conversion Formula (ADC to ppm):**
```cpp
// Approximate mapping (calibrate for your MQ-2)
int adcValue = analogRead(GAS_PIN);
float ppm = map(adcValue, GAS_BASELINE, 4095, 0, 1000);  // 0-1000 ppm range
```

**Test:**
1. Upload sketch
2. Open Serial Monitor (115200 baud)
3. Record gas readings in fresh air
4. Expose sensor to gas source (lighter, spray, etc.) **carefully**
5. Verify readings increase
6. Check Firebase → Realtime Database → `properties/property_001/rooms/room_001/latest/gas`

### 2. Temperature & Humidity Sensor (DHT22)

**Purpose:** Monitor room temperature and humidity

**Pin:** GPIO4

**Wiring:**
```
DHT22 Pin1 (VCC)  → ESP32 3.3V
DHT22 Pin2 (Data) → ESP32 GPIO4 (with 10K pullup to 3.3V)
DHT22 Pin3 (NC)   → Not connected
DHT22 Pin4 (GND)  → ESP32 GND
```

**Pullup Resistor:** Connect 10K resistor between GPIO4 and 3.3V

**Initialization:**
```cpp
#define DHT_PIN  4
#define DHT_TYPE DHT22
DHT dht(DHT_PIN, DHT_TYPE);

void setup() {
  dht.begin();  // Initialize DHT
}
```

**Reading Data:**
```cpp
void readDHT() {
  float temp = dht.readTemperature();
  float humidity = dht.readHumidity();
  
  if (isnan(temp) || isnan(humidity)) {
    Serial.println("DHT read failed!");
    return;
  }
  
  readings.temperature = temp;
  readings.humidity = humidity;
}
```

**Troubleshooting DHT:**
- If readings are `NaN`, check:
  - Wiring (especially pullup resistor)
  - Power supply (needs 3.3V)
  - Library installation (Adafruit DHT + Unified Sensor)

### 3. Motion Sensor (PIR)

**Purpose:** Detect human presence in room

**Pin:** GPIO27

**Wiring:**
```
PIR VCC → ESP32 3.3V or 5V
PIR GND → ESP32 GND
PIR OUT → ESP32 GPIO27
```

**Initialization:**
```cpp
#define PIR_PIN 27

void setup() {
  pinMode(PIR_PIN, INPUT);
}
```

**Reading & Logic:**
```cpp
void readMotion() {
  readings.pirDetected = digitalRead(PIR_PIN);  // HIGH = motion
  
  if (readings.pirDetected) {
    lastMotionTime = millis();  // Update last motion timestamp
  }
  
  // Occupancy timeout: VACANT if no motion for 5 minutes
  unsigned long timeSinceMotion = millis() - lastMotionTime;
  if (timeSinceMotion > VACANCY_TIMEOUT_MS) {
    readings.occupancyState = "VACANT";
  } else {
    readings.occupancyState = "OCCUPIED";
  }
}
```

**Calibration:**
- Most PIR sensors have adjustable sensitivity (potentiometer on module)
- Adjust for your room size (typically 3-7 meters range)
- Test with hand movement

### 4. Door/Window Sensor (Reed Switch)

**Purpose:** Detect door/window open/closed state

**Pin:** GPIO26 (with internal pullup)

**Wiring:**
```
Reed Switch → ESP32 GPIO26
Reed Switch → ESP32 GND
(Magnetic trigger on door frame)
```

**Initialization:**
```cpp
#define REED_PIN 26

void setup() {
  pinMode(REED_PIN, INPUT_PULLUP);  // Internal pullup enabled
}
```

**Reading:**
```cpp
void readDoor() {
  // LOW = door open, HIGH = door closed (due to pullup)
  readings.doorOpen = !digitalRead(REED_PIN);
}
```

### 5. Energy Meter (PZEM-004T)

**Purpose:** Monitor voltage, current, power, and energy consumption

**Pins:** GPIO16 (RX2), GPIO17 (TX2) - Hardware Serial2

**Wiring:**
```
PZEM TX → ESP32 GPIO17 (RX2)
PZEM RX → ESP32 GPIO16 (TX2)
PZEM GND → ESP32 GND

PZEM Load Side:
- Phase → Your load
- Neutral → Your load return
```

**⚠️ WARNING:** PZEM-004T measures **mains voltage (AC 220V or 110V)**. Use proper electrical safety.

**Initialization:**
```cpp
PZEM004Tv30 pzem(Serial2, PZEM_RX_PIN, PZEM_TX_PIN);

void setup() {
  Serial2.begin(9600, SERIAL_8N1, PZEM_RX_PIN, PZEM_TX_PIN);
}
```

**Reading Data:**
```cpp
void readPZEM() {
  readings.voltage = pzem.voltage();
  readings.current = pzem.current();
  readings.power = pzem.power();
  readings.energy = pzem.energy();  // Cumulative kWh
  
  if (isnan(readings.voltage)) {
    Serial.println("PZEM read failed!");
  }
}
```

**PZEM Calibration:**
- Voltage offset: `pzem.setVoltageCalibration(220.0);`
- Power reset: `pzem.resetEnergy();` (resets cumulative energy)
- Refer to PZEM library docs for detailed calibration

### 6. Relay Control Outputs

**Purpose:** Control lights, fan, pump, buzzer

**Pins & Types:**
```
Relay 1 (Lights)  → GPIO13 (Active LOW)
Relay 2 (Fan)     → GPIO12 (Active LOW)
Relay 3 (Pump)    → GPIO14 (Active LOW)
Buzzer            → GPIO25 (Active HIGH)
```

**Initialization:**
```cpp
#define RELAY_LIGHT  13
#define RELAY_FAN    12
#define RELAY_PUMP   14
#define BUZZER_PIN   25

void setup() {
  pinMode(RELAY_LIGHT, OUTPUT);
  pinMode(RELAY_FAN, OUTPUT);
  pinMode(RELAY_PUMP, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  
  // All relays OFF (active LOW = HIGH to turn off)
  digitalWrite(RELAY_LIGHT, HIGH);
  digitalWrite(RELAY_FAN, HIGH);
  digitalWrite(RELAY_PUMP, HIGH);
  digitalWrite(BUZZER_PIN, LOW);   // Buzzer OFF
}
```

**Control from Firebase:**
```cpp
// Listen for device commands from Firebase
void listenDeviceControl() {
  if (Firebase.RTDB.getJSON(&fbdo, basePath + "/devices")) {
    FirebaseJson &json = fbdo.to<FirebaseJson>();
    
    bool lights = json.getBool("lights");
    bool fan = json.getBool("exhaustFan");
    bool pump = json.getBool("waterPump");
    
    // Apply to GPIO (invert for active LOW)
    digitalWrite(RELAY_LIGHT, !lights);
    digitalWrite(RELAY_FAN, !fan);
    digitalWrite(RELAY_PUMP, !pump);
  }
}
```

---

## Testing & Validation

### Test 1: Serial Monitor Verification

**Objective:** Verify all sensors are reading correctly

1. Open Arduino IDE → Tools → Serial Monitor
2. Set baud rate to **115200**
3. Watch output for 30 seconds

**Expected Output:**
```
═══════════════════════════════════════
  GREEN HOME HUB — ESP32 Node v1.0
═══════════════════════════════════════

🔄 Connecting to WiFi...
✓ WiFi connected: MyHomeNetwork
🔄 Connecting to Firebase...
✓ Firebase authenticated

📡 Reading Sensors:
  Temperature: 22.5°C
  Humidity: 55%
  Gas Level: 250 ppm (Normal)
  Motion: Detected
  Door: Closed
  Voltage: 230V
  Current: 2.5A
  Power: 575W
  Energy: 45.23 kWh

✓ Data pushed to Firebase
✓ Listening for device commands...
```

### Test 2: Firebase Console Verification

**Objective:** Confirm data is arriving in Firebase

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Realtime Database**
4. Navigate to `properties/property_001/rooms/room_001/latest/`
5. **Verify these fields are updating (check `updatedAt` timestamp):**
   - `temperature` (should be 15-30°C)
   - `humidity` (should be 30-80%)
   - `gas` (should be 100-500 in normal conditions)
   - `motionDetected` (boolean)
   - `doorOpen` (boolean)
   - `voltage` (should be ~220V or 110V depending on region)
   - `power` (should increase if loads are on)

**Example Valid Data:**
```json
{
  "temperature": 22.5,
  "humidity": 55,
  "gas": 250,
  "motionDetected": true,
  "doorOpen": false,
  "voltage": 230,
  "current": 2.5,
  "power": 575,
  "energy": 45.23,
  "updatedAt": 1687526400000
}
```

### Test 3: Frontend Dashboard Verification

**Objective:** Verify React frontend receives and displays sensor data

1. Open VS Code terminal
2. Run development server:
   ```bash
   npm install
   npm run dev
   ```
3. Navigate to `http://localhost:5173`
4. **Verify dashboard displays:**
   - Temperature & humidity in sensor cards
   - Gas level status
   - Motion detection status
   - Door state
   - Energy consumption

**If data doesn't appear:**
- Check `.env` file has correct Firebase credentials
- Check browser DevTools console for errors
- Verify Firebase security rules allow reads

### Test 4: Device Control Test

**Objective:** Verify frontend can control ESP32 relays

1. In Dashboard, toggle a device (e.g., "Lights")
2. Check Arduino Serial Monitor for command:
   ```
   Device command received: lights = true
   ✓ Relay activated
   ```
3. Check physical relay (should click/activate)
4. Verify state reflected in Firebase:
   - `properties/property_001/rooms/room_001/devices/lights` → `true`

### Test 5: Sensor Calibration Validation

**For each sensor, perform:**

| Sensor | Test | Expected Result |
|--------|------|-----------------|
| **Gas** | Expose to lighter/spray | Reading increases by 50+ ppm |
| **Temperature** | Blow warm air | Reading increases 1-2°C |
| **Humidity** | Spray water mist | Reading increases 5-10% |
| **PIR** | Wave hand in front | `motionDetected` = `true` |
| **Reed** | Open door | `doorOpen` = `true` |
| **Relay** | Toggle on dashboard | Relay clicks, power changes |

---

## Troubleshooting

### Problem: ESP32 Won't Connect to WiFi

**Symptoms:**
- Serial shows: `🔄 Connecting to WiFi... [TIMEOUT]`
- No connection established

**Solutions:**

1. **Verify WiFi credentials:**
   ```cpp
   #define WIFI_SSID     "YOUR_CORRECT_SSID"
   #define WIFI_PASSWORD "YOUR_CORRECT_PASSWORD"
   ```

2. **Check WiFi band (2.4GHz required):**
   - Some routers default to 5GHz
   - Switch to 2.4GHz or dual-band mode

3. **Reset WiFi settings (if using WiFiManager):**
   - Add to setup:
     ```cpp
     // Uncomment to reset WiFi credentials
     // WiFiManager wm;
     // wm.resetSettings();
     ```

4. **Check signal strength:**
   - Move ESP32 closer to router
   - Check for RF interference

### Problem: Firebase Connection Fails

**Symptoms:**
- Serial shows: `❌ Firebase connection failed`
- No data in console

**Solutions:**

1. **Verify API key & Database URL:**
   ```cpp
   #define FIREBASE_API_KEY      "YOUR_CORRECT_KEY"
   #define FIREBASE_DATABASE_URL "https://your-project.firebasedatabase.app"
   ```

2. **Check Firebase project is accessible:**
   - In Firebase Console, go to Realtime Database
   - Check if database is active (not suspended)

3. **Verify security rules allow Arduino:**
   - Go to Database → Rules
   - Should be in "test mode" (allows all reads/writes)
   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```

4. **Check internet connectivity:**
   ```cpp
   if (WiFi.status() == WL_CONNECTED) {
     Serial.println("WiFi OK");
   } else {
     Serial.println("WiFi NOT connected!");
   }
   ```

### Problem: Sensor Reads as NaN or 0

**Symptoms:**
- Serial: `temperature: NaN` or `humidity: 0`
- Firebase shows `null` values

**Solutions:**

**DHT22 Issues:**
- ✓ Check 10K pullup resistor is connected
- ✓ Verify GPIO4 wiring
- ✓ Reinstall Adafruit DHT library
- ✓ Try DHT sensor test sketch first:
  ```cpp
  #include <DHT.h>
  DHT dht(4, DHT22);
  void setup() { dht.begin(); }
  void loop() {
    float t = dht.readTemperature();
    Serial.println(t);
    delay(2000);
  }
  ```

**PZEM Issues:**
- ✓ Verify Serial2 pins (GPIO16=RX, GPIO17=TX)
- ✓ Check baud rate: `Serial2.begin(9600)`
- ✓ Ensure load is connected to PZEM output
- ✓ Try PZEM library example first

**Gas Sensor Issues:**
- ✓ Verify GPIO34 is connected
- ✓ Let sensor warm up 5-10 minutes
- ✓ Check power supply (should be 3.3V or 5V depending on module)

### Problem: Firebase Data Not Updating

**Symptoms:**
- Serial shows `✓ Data pushed to Firebase` but Firebase console shows old data
- `updatedAt` timestamp not changing

**Solutions:**

1. **Check Firebase path is correct:**
   - Should be: `properties/property_001/rooms/room_001/latest/`
   - Not: `properties/property_001/latest/` (missing rooms hierarchy)

2. **Verify Firebase rules allow writes:**
   - Database → Rules
   - Set to test mode (both read and write = true)

3. **Check PROPERTY_ID and ROOM_ID:**
   ```cpp
   #define PROPERTY_ID "property_001"
   #define ROOM_ID     "room_001"
   ```

4. **Monitor Firebase calls:**
   ```cpp
   if (Firebase.RTDB.setJSON(&fbdo, latestPath, json)) {
     Serial.println("✓ Firebase write successful");
   } else {
     Serial.print("❌ Error: ");
     Serial.println(fbdo.errorReason());  // Print error details
   }
   ```

### Problem: Frontend Not Receiving Data

**Symptoms:**
- Dashboard is empty or shows "Loading..."
- No data displays even though Firebase has values

**Solutions:**

1. **Check .env file variables:**
   - Ensure `VITE_FIREBASE_*` variables are set
   - Restart dev server after changing `.env`
   ```bash
   npm run dev
   ```

2. **Check browser console for errors:**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for Firebase connection errors

3. **Verify Realtime Database URL:**
   ```env
   VITE_FIREBASE_DATABASE_URL=https://your-project.firebasedatabase.app
   ```
   - Not: `https://your-project.firebaseio.com` (old format)

4. **Check React hooks are mounted:**
   - Ensure `useFirebaseRealtime()` is called
   - Check `listenSensors()` in `realtimeDbService.ts`

5. **Clear Firebase cache:**
   - Browser DevTools → Application → Clear all
   - Restart dev server

### Problem: Relay Not Responding to Commands

**Symptoms:**
- Frontend toggle works (UI updates)
- Relay doesn't click
- Serial shows no command received

**Solutions:**

1. **Verify relay pins are correct:**
   ```cpp
   #define RELAY_LIGHT  13
   #define RELAY_FAN    12
   #define RELAY_PUMP   14
   ```

2. **Check relay logic (active LOW vs HIGH):**
   ```cpp
   // Active LOW (relay turns on when pin is LOW)
   digitalWrite(RELAY_PIN, LOW);   // Relay ON
   digitalWrite(RELAY_PIN, HIGH);  // Relay OFF
   ```

3. **Verify Arduino is listening for device commands:**
   - In Firebase path: `properties/property_001/rooms/room_001/devices/`
   - Should update when you toggle frontend
   - Add debug logging:
   ```cpp
   if (Firebase.RTDB.getJSON(&fbdo, devicesPath)) {
     Serial.println("✓ Device command received");
   } else {
     Serial.println("❌ Failed to read device state");
   }
   ```

4. **Test relay directly:**
   ```cpp
   void setup() {
     pinMode(RELAY_LIGHT, OUTPUT);
   }
   void loop() {
     digitalWrite(RELAY_LIGHT, LOW);  // Should click/turn on
     delay(2000);
     digitalWrite(RELAY_LIGHT, HIGH); // Should click/turn off
     delay(2000);
   }
   ```

### Problem: High Latency or Data Lag

**Symptoms:**
- Data takes 10+ seconds to appear
- `updatedAt` timestamps are old

**Solutions:**

1. **Reduce sensor read interval:**
   ```cpp
   #define SENSOR_READ_INTERVAL  2000   // 2 seconds (reduce from 5000)
   #define FIREBASE_PUSH_INTERVAL 3000  // 3 seconds (reduce from 5000)
   ```

2. **Check WiFi signal strength:**
   ```cpp
   int rssi = WiFi.RSSI();
   Serial.print("Signal: ");
   Serial.println(rssi);  // Should be > -70 dBm for good signal
   ```

3. **Reduce data size:**
   - Only send changed values
   - Use `Firebase.RTDB.updateNode()` instead of `setJSON()`

4. **Check internet bandwidth:**
   - Test WiFi speed: `speedtest.net`
   - Other devices using network?

### Problem: Memory or Crash Issues

**Symptoms:**
- Serial monitor shows gibberish
- ESP32 reboots randomly
- `WDT (Watchdog Timer) reset`

**Solutions:**

1. **Check serial baud rate:**
   - Should be 115200 in both Arduino and Serial Monitor
   - Mismatch causes garbled output

2. **Reduce loop() cycle time:**
   - Add appropriate `delay()` to prevent watchdog timeout
   - Minimum 1 second between sensor reads

3. **Clear unused libraries:**
   - Remove unnecessary `#include` statements
   - Reduces memory footprint

4. **Check for infinite loops:**
   ```cpp
   // ❌ Bad - blocks forever
   while (WiFi.status() != WL_CONNECTED) { }
   
   // ✓ Good - timeout after 30 seconds
   unsigned long timeout = millis() + 30000;
   while (WiFi.status() != WL_CONNECTED && millis() < timeout) { }
   ```

---

## Database Structure Reference

### Complete Firebase Path Map

```
firebase_project_root/
├── properties/
│   └── property_001/
│       ├── rooms/
│       │   └── room_001/
│       │       ├── latest/               (← Sensor readings, updated every 3s)
│       │       │   ├── temperature       (number, °C)
│       │       │   ├── humidity          (number, %)
│       │       │   ├── gas               (number, ppm)
│       │       │   ├── motionDetected    (boolean)
│       │       │   ├── doorOpen          (boolean)
│       │       │   ├── voltage           (number, V)
│       │       │   ├── current           (number, A)
│       │       │   ├── power             (number, W)
│       │       │   ├── energy            (number, kWh)
│       │       │   ├── waterLevel        (number, %)
│       │       │   ├── flowRate          (number, L/min)
│       │       │   ├── totalLiters       (number, L)
│       │       │   ├── occupancyState    (string, VACANT|OCCUPIED|SLEEP|AWAY)
│       │       │   └── updatedAt         (number, ms timestamp)
│       │       │
│       │       ├── devices/              (← Device control states)
│       │       │   ├── lights            (boolean)
│       │       │   ├── waterPump         (boolean)
│       │       │   ├── exhaustFan        (boolean)
│       │       │   ├── motionDetection   (boolean)
│       │       │   ├── mainRelay         (boolean)
│       │       │   ├── buzzer            (boolean)
│       │       │   └── updatedAt         (number, ms timestamp)
│       │       │
│       │       └── alerts/               (← Active alerts)
│       │           ├── alert_001/
│       │           │   ├── type          (string: danger|warning|info|success)
│       │           │   ├── title         (string)
│       │           │   ├── message       (string)
│       │           │   ├── acknowledged  (boolean)
│       │           │   └── createdAt     (number, ms timestamp)
│       │           └── ...
│       │
│       └── history/                     (← Usage logs, optional)
│           ├── water/
│           │   └── YYYY-MM-DD/
│           │       └── logs             (array of daily usage)
│           └── energy/
│               └── YYYY-MM-DD/
│                   └── logs             (array of daily usage)
```

### Sensor Data Type Reference

| Field | Type | Min | Max | Unit | Notes |
|-------|------|-----|-----|------|-------|
| `temperature` | number | -10 | 50 | °C | DHT22 sensor |
| `humidity` | number | 0 | 100 | % | DHT22 sensor |
| `gas` | number | 0 | 1000 | ppm | MQ-2 sensor |
| `voltage` | number | 0 | 240 | V | PZEM-004T |
| `current` | number | 0 | 50 | A | PZEM-004T |
| `power` | number | 0 | 10000 | W | Calculated (V×I) |
| `energy` | number | 0 | ∞ | kWh | Cumulative, resets on boot |
| `waterLevel` | number | 0 | 100 | % | Optional water tank sensor |
| `flowRate` | number | 0 | 50 | L/min | Optional water flow meter |
| `totalLiters` | number | 0 | ∞ | L | Cumulative |
| `motionDetected` | boolean | - | - | - | PIR sensor |
| `doorOpen` | boolean | - | - | - | Reed switch |
| `humanPresent` | boolean | - | - | - | PIR + Ultrasonic |
| `relayActive` | boolean | - | - | - | Relay 2 state |
| `occupancyState` | string | - | - | - | VACANT\|OCCUPIED\|SLEEP\|AWAY |
| `updatedAt` | number | 0 | ∞ | ms | Unix timestamp |

---

## Quick Reference Checklist

### Initial Setup (One Time)
- [ ] Firebase project created
- [ ] Realtime Database enabled
- [ ] Database structure imported
- [ ] Web SDK credentials obtained
- [ ] Service account key downloaded
- [ ] .env file configured with credentials

### Arduino Setup
- [ ] Libraries installed (7 libraries)
- [ ] Sketch updated with credentials
- [ ] Pin definitions verified against wiring
- [ ] WiFi credentials configured
- [ ] Sketch uploaded successfully

### Hardware Setup
- [ ] All sensors wired correctly
- [ ] Power supply connected (3.3V/5V)
- [ ] Relays tested independently
- [ ] All components powered on

### Testing
- [ ] Serial Monitor shows successful connection
- [ ] Firebase Console shows live data updates
- [ ] Dashboard displays sensor values
- [ ] Device control toggles work
- [ ] All sensors calibrated and validated

### Ongoing
- [ ] Monitor Serial Monitor for errors (daily)
- [ ] Check Firebase database size (weekly)
- [ ] Review security rules before production
- [ ] Test failover/recovery scenarios
- [ ] Document any custom modifications

---

## Getting Help

**Common Documentation Files:**
- [ARDUINO_FIREBASE_DATA_SPEC.md](../ARDUINO_FIREBASE_DATA_SPEC.md) - Data structure details
- [GAS_SENSOR_FRONTEND_DATA_SPEC.md](./GAS_SENSOR_FRONTEND_DATA_SPEC.md) - Gas sensor specifics
- [flow_sensor_led.md](./flow_sensor_led.md) - Water flow sensor details

**Useful Links:**
- [Firebase Realtime Database Docs](https://firebase.google.com/docs/database)
- [Firebase ESP Client GitHub](https://github.com/mobizt/Firebase-ESP-Client)
- [Arduino Core for ESP32](https://github.com/espressif/arduino-esp32)
- [MQ-2 Gas Sensor Datasheet](https://datasheetspdf.com/pdf/MQ-2)
- [PZEM-004T Datasheet](https://datasheetspdf.com/pdf/PZEM-004T)

**Support Channels:**
- Check existing issues in firmware folder
- Review sensor_docs for specific sensor guides
- Check Arduino IDE Serial Monitor output for error codes

---

**Document Version:** 1.0  
**Last Updated:** June 2026  
**Status:** Active (Current Implementation)
