# Arduino → Firebase Data Specification

**Project:** Green Home Hub  
**Last Updated:** May 14, 2026  
**Purpose:** Complete reference for all sensor data, device states, and telemetry flowing from Arduino/ESP32 to Firebase Realtime Database.

---

## 📡 TABLE OF CONTENTS
1. [Firebase Database Structure](#firebase-database-structure)
2. [Sensor Telemetry Data](#sensor-telemetry-data)
3. [Device Control States](#device-control-states)
4. [Water Usage History](#water-usage-history)
5. [Alerts & Events](#alerts--events)
6. [LED Control](#led-control)
7. [Data Flow Diagram](#data-flow-diagram)
8. [Integration Status](#integration-status)
9. [Arduino Sketch Template](#arduino-sketch-template)

---

## Firebase Database Structure

### Root Path
```
└── properties/
    └── property_001/
        ├── rooms/
        │   └── room_001/
        │       ├── latest/           (Sensor readings)
        │       ├── devices/          (Device control states)
        │       └── alerts/           (Active alerts)
        └── history/                  (Water/Energy usage logs)
```

---

## Sensor Telemetry Data

### Firebase Path
```
properties/property_001/rooms/room_001/latest/
```

### Complete Data Structure (SensorsPayload)

| Field | Type | Unit | Range | Description | Status |
|-------|------|------|-------|-------------|--------|
| `voltage` | number | V | 0–240 | Mains supply voltage | ❌ TODO |
| `current` | number | A | 0–50 | Total current draw | ❌ TODO |
| `power` | number | W | 0–10000 | Real-time power consumption | ❌ TODO |
| `energy` | number | kWh | 0–∞ | Cumulative energy since boot | ❌ TODO |
| `gas` | number | units | 0–∞ | Gas meter reading | ❌ TODO |
| `pir` | boolean | — | true/false | Motion detection sensor | ❌ TODO |
| `doorOpen` | boolean | — | true/false | Door/window open state | ❌ TODO |
| `temperature` | number | °C | -10–50 | Room temperature | ❌ TODO |
| `humidity` | number | % | 0–100 | Relative humidity | ❌ TODO |
| `lightLevel` | number | lux/% | 0–255 | Ambient light sensor | ❌ TODO |
| `waterLevel` | number | % | 0–100 | Tank level percentage | ✅ WORKING |
| `flowRate` | number | L/min | 0–50 | Current water flow rate | ✅ WORKING |
| `totalLiters` | number | L | 0–∞ | Cumulative water consumed | ✅ WORKING |
| `relayStatus` | boolean | — | true/false | Main relay state | ❌ TODO |
| `buzzerStatus` | boolean | — | true/false | Buzzer/alarm state | ❌ TODO |
| `occupancyState` | string | — | See below | Room occupancy status | ✅ CALCULATED |
| `updatedAt` | number | ms | Unix timestamp | Last update time | ⚠️ OPTIONAL |

### occupancyState Values
```typescript
"VACANT"      // No motion, door closed, light off (>30 mins)
"OCCUPIED"    // Motion detected or recent activity
"SLEEP"       // Late night (22:00–06:00) + no motion
"AWAY"        // User configured (manual override)
```

### Example Firebase JSON
```json
{
  "voltage": 230,
  "current": 2.5,
  "power": 575,
  "energy": 45.23,
  "gas": 120,
  "pir": true,
  "doorOpen": false,
  "temperature": 24.5,
  "humidity": 55,
  "lightLevel": 180,
  "waterLevel": 75,
  "flowRate": 2.3,
  "totalLiters": 450,
  "relayStatus": true,
  "buzzerStatus": false,
  "occupancyState": "OCCUPIED",
  "updatedAt": 1715694000000
}
```

---

## Device Control States

### Firebase Path
```
properties/property_001/rooms/room_001/devices/
```

### Complete Data Structure (DevicesPayload)

| Field | Type | Default | Control Method | Description | Status |
|-------|------|---------|-----------------|-------------|--------|
| `lights` | boolean | false | Relay 1 | Main room lights | ✅ READY |
| `waterPump` | boolean | false | Relay 2 | Water pump on/off | ✅ READY |
| `exhaustFan` | boolean | false | Relay 3 | Ventilation/exhaust fan | ✅ READY |
| `motionDetection` | boolean | true | Software toggle | Enable/disable PIR sensor | ✅ READY |
| `mainRelay` | boolean | false | Relay 0 (Master) | Main power distribution | ✅ READY |
| `buzzer` | boolean | false | Buzzer pin | Alert buzzer | ✅ READY |
| `updatedAt` | number | — | Auto-set | Timestamp of last change | ⚠️ OPTIONAL |

### Example Firebase JSON
```json
{
  "lights": true,
  "waterPump": false,
  "exhaustFan": true,
  "motionDetection": true,
  "mainRelay": true,
  "buzzer": false,
  "updatedAt": 1715694050000
}
```

### Control Flow
```
Web Dashboard (React)
  ↓ toggleDevice(deviceId)
  ↓ updateDevice() [realtimeDbService.ts]
  ↓ Firebase Realtime Update
  ↓ Arduino receives change via listener
  ↓ Arduino switches relay/pin
  ↓ Arduino updates status back to Firebase
  ↓ Dashboard reflects new state (realtime)
```

---

## Water Usage History

### Firebase Path
```
properties/property_001/history/
```

### Record Structure (WaterUsageRecord)

| Field | Type | Unit | Description |
|-------|------|------|-------------|
| `roomId` | string | — | Room identifier (e.g., "room_001") |
| `flowRate` | number | L/min | Flow rate at this moment |
| `createdAt` | number | ms | Unix timestamp of reading |

### Example Records
```json
{
  "rec_001": {
    "roomId": "room_001",
    "flowRate": 2.1,
    "createdAt": 1715693400000
  },
  "rec_002": {
    "roomId": "room_001",
    "flowRate": 2.3,
    "createdAt": 1715693403000
  },
  "rec_003": {
    "roomId": "room_001",
    "flowRate": 0,
    "createdAt": 1715693406000
  }
}
```

### Data Aggregation (Web App Calculates)
- **Update Frequency:** Every 3 seconds (approximate)
- **Today's Usage:** Sum of all (flowRate × 0.05 min) for today
- **Weekly Usage:** Aggregated by day (sum of hourly flows)
- **Peak Flow:** Max flowRate in period

---

## Alerts & Events

### Firebase Path
```
properties/property_001/rooms/room_001/alerts/
```

### Alert Structure (AlertRecord)

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `id` | string | — | Unique alert identifier |
| `type` | string | "danger" \| "warning" \| "info" \| "success" | Severity level |
| `title` | string | — | Short alert title |
| `message` | string | — | Detailed message |
| `source` | string | — | Origin (e.g., "waterSensor", "powerMonitor") |
| `acknowledged` | boolean | false | User dismissed? |
| `createdAt` | number | ms | Unix timestamp |

### Common Alert Triggers

| Condition | Type | Title | Example Message |
|-----------|------|-------|-----------------|
| Water level < 10% | danger | Critical Water Level | Tank water level is critically low |
| Water level 10–30% | warning | Low Water Level | Please refill water tank soon |
| Flow rate spike | danger | Possible Leak | Water flow detected without pump active |
| Power > 5kW | warning | High Power Draw | Consumption exceeding 5 kW |
| Temperature > 35°C | warning | High Temperature | Room temperature exceeds 35°C |
| Device offline > 5 min | danger | Device Offline | ESP32 not communicating |
| Relay failure | danger | Control Failure | Failed to switch relay after command |
| Door open > 10 min | info | Door Open | Door has been open for 10 minutes |

### Example Alert JSON
```json
{
  "alert_001": {
    "id": "alert_001",
    "type": "danger",
    "title": "Critical Water Level",
    "message": "Water tank is below 10%. Pump may stop.",
    "source": "waterSensor",
    "acknowledged": false,
    "createdAt": 1715694000000
  }
}
```

---

## LED Control

### Firebase Path
```
properties/property_001/rooms/room_001/led/
```

### Structure

| Field | Type | Value | Meaning |
|-------|------|-------|---------|
| `status` | number \| null | 0 | LED OFF |
| | | 1 | LED ON |
| | | null | Not set |

### Control Methods
- **Web Dashboard:** Click LED indicator to toggle
- **Arduino:** Listen on Firebase path, switch LED pin
- **Realtime Feedback:** Status reflects actual LED state

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Arduino / ESP32                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │  SENSORS (GPIO/ADC inputs)                       │   │
│  ├────────────────────────────────────────────────┤   │
│  │  • Voltage divider (GPIO34)    → voltage        │   │
│  │  • ACS712 current sensor (A0)  → current        │   │
│  │  • Power meter (pulse)         → energy         │   │
│  │  • Gas meter (pulse)           → gas            │   │
│  │  • PIR sensor (GPIO12)         → pir            │   │
│  │  • Reed switch (GPIO13)        → doorOpen       │   │
│  │  • DHT22 (GPIO21)              → temp/humidity  │   │
│  │  • LDR sensor (A1)             → lightLevel     │   │
│  │  • Water level analog (A2)     → waterLevel     │   │
│  │  • Flow meter (GPIO35, pulse)  → flowRate       │   │
│  └──────────────────────────────────────────────────┘   │
│            ↓ (every 3 seconds or on event)              │
│  ┌──────────────────────────────────────────────────┐   │
│  │  PROCESSING                                       │   │
│  ├────────────────────────────────────────────────┤   │
│  │  • Validate readings (bounds check)            │   │
│  │  • Calculate derived metrics                    │   │
│  │  • Detect anomalies/thresholds                 │   │
│  │  • Generate alerts if needed                    │   │
│  │  • Determine occupancyState (logic)             │   │
│  └──────────────────────────────────────────────────┘   │
│            ↓                                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │  FIREBASE REALTIME DATABASE                     │   │
│  ├────────────────────────────────────────────────┤   │
│  │  → Update: properties/.../latest/ (sensors)    │   │
│  │  → Append: properties/.../history/ (water)     │   │
│  │  → Create: alerts/ (if threshold breach)       │   │
│  │  ← Listen: devices/ (control commands)         │   │
│  │  ← Listen: led/ (LED control)                  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│             WEB DASHBOARD (React + TypeScript)           │
│  ┌──────────────────────────────────────────────────┐   │
│  │  REAL-TIME LISTENERS                            │   │
│  ├────────────────────────────────────────────────┤   │
│  │  • useFirebaseRealtime() → sensor updates       │   │
│  │  • useWaterData() → water history aggregation   │   │
│  │  • useHistoryData() → energy/cost analytics     │   │
│  │  • listenAlerts() → alert notifications         │   │
│  └──────────────────────────────────────────────────┘   │
│            ↓                                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │  PAGES & COMPONENTS                             │   │
│  ├────────────────────────────────────────────────┤   │
│  │  • Index.tsx → Live dashboard (all sensors)    │   │
│  │  • Water.tsx → Tank, flow, weekly usage         │   │
│  │  • Analytics.tsx → Energy charts & cost        │   │
│  │  • Control.tsx → Device on/off toggles         │   │
│  │  • Alerts.tsx → Alert history & acknowledge    │   │
│  │  • StatsOverview → Real-time cards             │   │
│  │  • SensorCard → Individual sensor display      │   │
│  └──────────────────────────────────────────────────┘   │
│            ↓ (user interaction)                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  CONTROLS (toggleDevice, setLEDControl)        │   │
│  │  → Write back to Firebase devices/led paths     │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## Integration Status

### ✅ FULLY WORKING
- [x] Water level sensor (0–100%)
- [x] Water flow rate (L/min) with pulse counter
- [x] Cumulative water usage (totalLiters)
- [x] Water pump control (relay + feedback)
- [x] Firebase Realtime DB connection
- [x] Basic alert system
- [x] Device control states (lights, fan, pump, relay, buzzer)
- [x] LED control (on/off)
- [x] Real-time dashboard updates
- [x] Water usage history aggregation
- [x] Occupancy state calculation

### ⚠️ PARTIALLY WORKING
- [ ] Tariff-based cost calculation (structure ready, rates may vary)
- [ ] Analytics graphs (basic charts working, more data needed)

### ❌ NOT YET INTEGRATED
Priority sensors needed for full dashboard:

1. **Temperature & Humidity Sensor** (DHT22 or SHT3x)
   - Arduino pin: GPIO21 (I2C or digital)
   - Firebase fields: `temperature`, `humidity`
   - Priority: **HIGH** (occupancy & comfort)

2. **Current/Power Sensor** (ACS712 5A or 30A)
   - Arduino pin: GPIO34 (ADC) or A0
   - Firebase fields: `current`, `power`, `energy`
   - Priority: **HIGH** (cost calculation)

3. **Motion Sensor (PIR)** (HC-SR501)
   - Arduino pin: GPIO12 (digital)
   - Firebase fields: `pir`, influences `occupancyState`
   - Priority: **MEDIUM** (occupancy detection)

4. **Door/Window Sensor** (Magnetic reed switch)
   - Arduino pin: GPIO13 (digital)
   - Firebase fields: `doorOpen`
   - Priority: **MEDIUM** (comfort alerts)

5. **Gas Meter Integration** (Pulse counter or analog)
   - Arduino pin: GPIO36 (digital) or A3 (analog)
   - Firebase fields: `gas`
   - Priority: **MEDIUM**

6. **Light Sensor (LDR)** (photoresistor + divider)
   - Arduino pin: GPIO35 (ADC) or A1
   - Firebase fields: `lightLevel`
   - Priority: **LOW** (automation enhancement)

7. **Voltage Monitoring** (Voltage divider)
   - Arduino pin: GPIO32 (ADC) or A4
   - Firebase fields: `voltage`
   - Priority: **LOW** (monitoring only)

### 📋 FEATURE COMPLETION CHART

```
Sensor Data Collection:        [████░░░░░░░░░░░░░░░░░░░░░░] 15%
Device Control:                [███████████████████░░░░░░░░] 90%
Historical Data Logging:       [██████████░░░░░░░░░░░░░░░░░░] 35%
Cost Tracking & Analytics:     [█████░░░░░░░░░░░░░░░░░░░░░░░] 15%
Alerts & Notifications:        [██████████░░░░░░░░░░░░░░░░░░] 30%
Dashboard UI & Visualization:  [█████████████████░░░░░░░░░░░] 50%
```

---

## Arduino Sketch Template

### Header & Includes
```cpp
#include <WiFi.h>
#include <FirebaseESP32.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// WiFi & Firebase credentials (use .env or secrets)
#define WIFI_SSID "your_ssid"
#define WIFI_PASSWORD "your_password"
#define FIREBASE_HOST "your-project.firebaseio.com"
#define FIREBASE_AUTH "your_db_secret"

// Pin definitions
#define WATER_LEVEL_PIN A0
#define FLOW_METER_PIN 35
#define DHT_PIN 21
#define CURRENT_SENSOR_PIN 34
#define VOLTAGE_SENSOR_PIN 32
#define PIR_PIN 12
#define DOOR_PIN 13
#define LIGHT_SENSOR_PIN 35
#define GAS_METER_PIN 36

// Sensors
DHT dht(DHT_PIN, DHT22);
FirebaseData firebaseData;
```

### Sensor Reading Function
```cpp
void readAllSensors() {
  // Water sensors
  float waterLevel = analogRead(WATER_LEVEL_PIN) / 40.95; // 0-100%
  float flowRate = getFlowRate(); // Implemented with ISR
  
  // Environmental
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  
  // Electrical
  float current = readCurrentSensor();
  float power = calculatePower(current, voltage);
  float voltage = readVoltageSensor();
  
  // Digital sensors
  bool pir = digitalRead(PIR_PIN);
  bool doorOpen = digitalRead(DOOR_PIN);
  int lightLevel = analogRead(LIGHT_SENSOR_PIN);
  int gasReading = analogRead(GAS_METER_PIN);
  
  // Update Firebase
  updateFirebaseSensors(waterLevel, flowRate, temperature, humidity, 
                       current, power, voltage, pir, doorOpen, 
                       lightLevel, gasReading);
}

void updateFirebaseSensors(float wl, float fr, float temp, float humid,
                          float curr, float pw, float volt, bool pir,
                          bool door, int light, int gas) {
  Firebase.setFloat(firebaseData, 
    "properties/property_001/rooms/room_001/latest/waterLevel", wl);
  Firebase.setFloat(firebaseData, 
    "properties/property_001/rooms/room_001/latest/flowRate", fr);
  Firebase.setFloat(firebaseData, 
    "properties/property_001/rooms/room_001/latest/temperature", temp);
  Firebase.setFloat(firebaseData, 
    "properties/property_001/rooms/room_001/latest/humidity", humid);
  Firebase.setFloat(firebaseData, 
    "properties/property_001/rooms/room_001/latest/current", curr);
  Firebase.setFloat(firebaseData, 
    "properties/property_001/rooms/room_001/latest/power", pw);
  Firebase.setFloat(firebaseData, 
    "properties/property_001/rooms/room_001/latest/voltage", volt);
  Firebase.setBool(firebaseData, 
    "properties/property_001/rooms/room_001/latest/pir", pir);
  Firebase.setBool(firebaseData, 
    "properties/property_001/rooms/room_001/latest/doorOpen", door);
  Firebase.setInt(firebaseData, 
    "properties/property_001/rooms/room_001/latest/lightLevel", light);
  Firebase.setInt(firebaseData, 
    "properties/property_001/rooms/room_001/latest/gas", gas);
  Firebase.setULong(firebaseData,
    "properties/property_001/rooms/room_001/latest/updatedAt", 
    millis());
}
```

### Device Control Listener
```cpp
void listenToDeviceControl() {
  Firebase.getJSON(firebaseData, 
    "properties/property_001/rooms/room_001/devices");
  
  if (firebaseData.dataType() == "json") {
    JsonObject &obj = firebaseData.jsonObject();
    
    bool lights = obj["lights"] | false;
    bool pump = obj["waterPump"] | false;
    bool fan = obj["exhaustFan"] | false;
    bool relay = obj["mainRelay"] | false;
    bool buzzer = obj["buzzer"] | false;
    
    // Apply to GPIO pins
    digitalWrite(RELAY_LIGHTS, lights);
    digitalWrite(RELAY_PUMP, pump);
    digitalWrite(RELAY_FAN, fan);
    digitalWrite(RELAY_MAIN, relay);
    digitalWrite(BUZZER_PIN, buzzer);
  }
}
```

### Main Loop
```cpp
void loop() {
  if (millis() % 3000 == 0) {  // Every 3 seconds
    readAllSensors();
    listenToDeviceControl();
  }
}
```

---

## 🔍 Testing & Validation

### Before Going Live
- [ ] All sensor pins wired and tested independently
- [ ] Firebase Realtime DB rules allow read/write for authenticated users
- [ ] `updatedAt` timestamps are Unix epoch in milliseconds
- [ ] Sensor ranges validated (no negative values, no out-of-range)
- [ ] Device control commands trigger actual relay switches
- [ ] Alert generation tested for each threshold scenario
- [ ] Water history records accumulate correctly
- [ ] Dashboard refreshes in < 1 second for all data

### Firebase Rules Template
```json
{
  "rules": {
    "properties": {
      "property_001": {
        "rooms": {
          "room_001": {
            "latest": {
              ".read": "auth != null",
              ".write": "auth != null"
            },
            "devices": {
              ".read": "auth != null",
              ".write": "auth != null"
            },
            "alerts": {
              ".read": "auth != null",
              ".write": "auth != null"
            }
          }
        },
        "history": {
          ".read": "auth != null",
          ".write": "auth != null"
        }
      }
    }
  }
}
```

---

## 📞 Summary Checklist

**What Arduino sends to Firebase every 3 seconds:**
- ✅ 14 sensor readings (water level, flow, temp, humidity, voltage, current, power, gas, PIR, door, light, energy)
- ✅ 6 device control states (lights, pump, fan, relay, motion, buzzer)
- ✅ Timestamp of update

**What Web Dashboard receives & displays:**
- ✅ Real-time sensor values
- ✅ Device control toggles
- ✅ Water usage trends (daily/weekly)
- ✅ Cost breakdown by tariff block
- ✅ Alert notifications
- ✅ Connection status

**What needs to be wired next:**
1. DHT22 (temp/humidity)
2. ACS712 (current)
3. PIR (motion)
4. Door sensor (magnetic)
5. Gas meter
6. Light sensor
7. Voltage divider

---

**For questions or updates, refer to:**
- [src/services/realtimeDbService.ts](../src/services/realtimeDbService.ts) — Data interfaces
- [src/hooks/useFirebaseRealtime.ts](../src/hooks/useFirebaseRealtime.ts) — Data consumption
- [firmware/green_home_node/green_home_node.ino](../firmware/green_home_node/green_home_node.ino) — Arduino code
