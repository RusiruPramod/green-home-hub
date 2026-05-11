# Firebase Implementation Plan for Green Home Hub

## 1. Current Project State

The current `green-home-hub` project is a React + TypeScript + Vite frontend dashboard.

At the moment:

- The dashboard runs locally with Vite.
- Sensor data is simulated inside `src/hooks/useMQTTSimulation.ts`.
- Device controls are local React state only.
- The `.env` file points to a backend API:

```env
VITE_API_URL=http://localhost:5000/api
```

- The README mentions a Node.js/Express/MongoDB backend, but the backend folder is not available in the current repository.
- The app already has prepared API service files, but the main dashboard pages mostly do not use real backend data yet.

Because the project needs actual sensor data from ESP32, Firebase can replace the missing Node.js + MongoDB backend.

## 2. New Target Architecture

Recommended architecture:

```text
ESP32 Sensors
      |
      | WiFi
      v
Firebase Realtime Database
      |
      | Firebase Web SDK
      v
React Dashboard
```

Device control flow:

```text
React Dashboard
      |
      | writes command state
      v
Firebase Realtime Database
      |
      | ESP32 reads command state
      v
Relay / Buzzer / Output Devices
```

Gas safety flow:

```text
Gas Sensor
      |
      v
ESP32
      |
      | immediate local action
      v
Buzzer + Relay
      |
      | upload reading and alert
      v
Firebase Realtime Database
      |
      v
React Dashboard Alert
```

Important: Gas detection, buzzer activation, and relay safety actions should happen directly on the ESP32 first. Do not depend on Firebase or the internet for emergency behavior.

## 3. Recommended Firebase Service

Use **Firebase Realtime Database**.

Reason:

- It is simple for live IoT values.
- React can subscribe to real-time changes.
- ESP32 can write sensor data directly.
- It avoids building a custom backend.
- It is easier to demonstrate for a final year project.

Firestore is also possible, but Realtime Database is better for this project because the system needs frequent live sensor updates.

## 4. Required Software

Install or prepare the following:

| Purpose | Software |
| --- | --- |
| ESP32 coding | Arduino IDE |
| Frontend coding | VS Code |
| Database/backend replacement | Firebase Realtime Database |
| React Firebase integration | Firebase Web SDK |
| ESP32 Firebase integration | Firebase ESP Client Arduino library |
| Sensor testing | Arduino Serial Monitor |
| Database inspection | Firebase Console |

## 5. Required Accounts and Tools

You need:

- Google account
- Firebase project
- Arduino IDE
- Node.js and npm
- Existing React project
- ESP32 board package installed in Arduino IDE

## 6. Firebase Project Setup

### Step 1: Create Firebase Project

1. Go to:

```text
https://console.firebase.google.com/
```

2. Click **Add project**.
3. Enter project name:

```text
esp32led-b6105
```

4. Disable Google Analytics if you do not need it.
5. Create the project.

### Step 2: Create Realtime Database

1. Open your Firebase project.
2. Go to **Build > Realtime Database**.
3. Click **Create Database**.
4. Select a nearby region.
5. Start in test mode during development.

Development rules:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

Warning: These rules are only for development and demonstration. Do not use public read/write rules in production.

### Step 3: Register Web App

1. Go to **Project settings**.
2. Under **Your apps**, click the web icon.
3. Register app name:

```text
esp32led-web
```

4. Copy the Firebase config.

Example:

```ts
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## 7. Recommended Firebase Data Structure

Use this structure:

```json
{
  "properties": {
    "property_001": {
      "settings": {
        "tariffs": {
          "currency": "LKR",
          "offPeakRate": 30,
          "dayRate": 50,
          "peakRate": 70
        }
      },
      "rooms": {
        "room_101": {
          "latest": {
            "voltage": 230.4,
            "current": 1.52,
            "power": 350,
            "energy": 2.8,
            "gas": 420,
            "pir": true,
            "doorOpen": false,
            "temperature": 29,
            "humidity": 70,
            "lightLevel": 650,
            "waterLevel": 78,
            "flowRate": 12,
            "relayStatus": true,
            "buzzerStatus": true,
            "occupancyState": "OCCUPIED_ACTIVE",
            "updatedAt": 1710000000
          },
          "devices": {
            "lights": true,
            "waterPump": false,
            "exhaustFan": true,
            "motionDetection": true,
            "mainRelay": false,
            "buzzer": false
          }
        }
      },
      "alerts": {
        "alert_001": {
          "type": "gas",
          "level": "danger",
          "message": "High gas level detected",
          "value": 420,
          "acknowledged": false,
          "createdAt": 1710000000
        }
      },
      "history": {
        "reading_001": {
          "roomId": "room_101",
          "voltage": 230.4,
          "current": 1.52,
          "power": 350,
          "energy": 2.8,
          "gas": 420,
          "pir": true,
          "doorOpen": false,
          "temperature": 29,
          "humidity": 70,
          "lightLevel": 650,
          "createdAt": 1710000000
        }
      }
    }
  }
}
```

## 8. Data Meaning

| Field | Meaning |
| --- | --- |
| `voltage` | Voltage from PZEM-004T |
| `current` | Current from PZEM-004T |
| `power` | Power in watts from PZEM-004T |
| `energy` | Energy in kWh from PZEM-004T |
| `gas` | Gas sensor analog value |
| `pir` | PIR motion detected or not |
| `doorOpen` | Reed switch door state |
| `temperature` | DHT11/DHT22 temperature |
| `humidity` | DHT11/DHT22 humidity |
| `lightLevel` | LDR light value |
| `waterLevel` | Water level percentage, if used |
| `flowRate` | Flow sensor rate, if used |
| `relayStatus` | Safety or appliance relay state |
| `buzzerStatus` | Buzzer state |
| `updatedAt` | Last update timestamp |

## 9. Frontend Implementation Plan

### Step 1: Install Firebase SDK

From the React project folder:

```powershell
cd "c:\Users\pansi\OneDrive - SOFTLABS INNOVATION PVT LTD\Desktop\Capstone project\green-home-hub"
npm install firebase
```

### Step 2: Add Firebase Environment Variables

Update `.env`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_HOME_ID=home_001
```

Keep `.env.example` updated with placeholder values:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_HOME_ID=home_001
```

### Step 3: Create Firebase Config File

Create:

```text
src/services/firebase.ts
```

Purpose:

- Initialize Firebase app.
- Export Realtime Database instance.

Example:

```ts
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseApp = initializeApp(firebaseConfig);
export const database = getDatabase(firebaseApp);
```

### Step 4: Create Firebase Sensor Hook

Create:

```text
src/hooks/useFirebaseSensors.ts
```

Purpose:

- Read live sensor values from Firebase.
- Replace simulated sensor values.

Example:

```ts
import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { database } from "@/services/firebase";

export interface FirebaseSensorData {
  voltage: number;
  current: number;
  power: number;
  energy: number;
  gas: number;
  pir: boolean;
  doorOpen: boolean;
  temperature: number;
  humidity: number;
  lightLevel: number;
  waterLevel: number;
  flowRate: number;
  relayStatus: boolean;
  buzzerStatus: boolean;
  updatedAt: number;
}

const defaultSensorData: FirebaseSensorData = {
  voltage: 0,
  current: 0,
  power: 0,
  energy: 0,
  gas: 0,
  pir: false,
  doorOpen: false,
  temperature: 0,
  humidity: 0,
  lightLevel: 0,
  waterLevel: 0,
  flowRate: 0,
  relayStatus: false,
  buzzerStatus: false,
  updatedAt: 0,
};

export function useFirebaseSensors() {
  const [sensorData, setSensorData] = useState<FirebaseSensorData>(defaultSensorData);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const homeId = import.meta.env.VITE_HOME_ID || "home_001";
    const latestRef = ref(database, `homes/${homeId}/latest`);

    const unsubscribe = onValue(
      latestRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setSensorData({ ...defaultSensorData, ...snapshot.val() });
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setIsConnected(false);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return {
    sensorData,
    loading,
    error,
    isConnected,
    connectionStatus: isConnected ? "connected" : "disconnected",
    lastUpdate: sensorData.updatedAt ? new Date(sensorData.updatedAt) : null,
  };
}
```

### Step 5: Create Firebase Device Hook

Create:

```text
src/hooks/useFirebaseDevices.ts
```

Purpose:

- Read device states from Firebase.
- Write control commands from React to Firebase.
- ESP32 will later read these command states.

Example:

```ts
import { useEffect, useState } from "react";
import { onValue, ref, update } from "firebase/database";
import { database } from "@/services/firebase";

export interface FirebaseDeviceStates {
  lights: boolean;
  waterPump: boolean;
  exhaustFan: boolean;
  motionDetection: boolean;
  mainRelay: boolean;
  buzzer: boolean;
}

const defaultDeviceStates: FirebaseDeviceStates = {
  lights: false,
  waterPump: false,
  exhaustFan: false,
  motionDetection: true,
  mainRelay: false,
  buzzer: false,
};

export function useFirebaseDevices() {
  const [deviceStates, setDeviceStates] = useState<FirebaseDeviceStates>(defaultDeviceStates);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const homeId = import.meta.env.VITE_HOME_ID || "home_001";
    const devicesRef = ref(database, `homes/${homeId}/devices`);

    const unsubscribe = onValue(devicesRef, (snapshot) => {
      if (snapshot.exists()) {
        setDeviceStates({ ...defaultDeviceStates, ...snapshot.val() });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleDevice = async (device: keyof FirebaseDeviceStates) => {
    const homeId = import.meta.env.VITE_HOME_ID || "home_001";
    const devicesRef = ref(database, `homes/${homeId}/devices`);

    await update(devicesRef, {
      [device]: !deviceStates[device],
    });
  };

  return {
    deviceStates,
    loading,
    toggleDevice,
  };
}
```

### Step 6: Replace Simulated Hook in Dashboard

Current pages use:

```ts
import { useMQTTSimulation } from "@/hooks/useMQTTSimulation";
```

Replace with Firebase hooks:

```ts
import { useFirebaseSensors } from "@/hooks/useFirebaseSensors";
import { useFirebaseDevices } from "@/hooks/useFirebaseDevices";
```

Example in `src/pages/Index.tsx`:

```ts
const {
  sensorData,
  isConnected,
  connectionStatus,
  lastUpdate,
} = useFirebaseSensors();

const {
  deviceStates,
  toggleDevice,
} = useFirebaseDevices();
```

Do this gradually, page by page:

1. `src/pages/Index.tsx`
2. `src/pages/Energy.tsx`
3. `src/pages/Water.tsx`
4. `src/pages/Gas.tsx`
5. `src/pages/Control.tsx`
6. `src/pages/Analytics.tsx`

### Step 7: Keep `useMQTTSimulation` Temporarily

Do not delete `useMQTTSimulation.ts` immediately.

Keep it as a fallback while Firebase integration is being tested.

Once Firebase is fully working, either:

- Remove it, or
- Rename it as `useDemoSensors.ts`

## 10. ESP32 Implementation Plan

### Step 1: Install Arduino IDE

Install Arduino IDE from:

```text
https://www.arduino.cc/en/software
```

### Step 2: Install ESP32 Board Support

In Arduino IDE:

1. Open **File > Preferences**.
2. Add this URL to **Additional Boards Manager URLs**:

```text
https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
```

3. Go to **Tools > Board > Boards Manager**.
4. Search `ESP32`.
5. Install `esp32 by Espressif Systems`.

### Step 3: Install Arduino Libraries

Install these libraries:

```text
Firebase ESP Client
ArduinoJson
PZEM004Tv30
DHT sensor library
Adafruit Unified Sensor
```

### Step 4: ESP32 Pin Plan

Example pin mapping:

| Component | ESP32 Pin |
| --- | --- |
| PIR Sensor | GPIO 27 |
| Door Reed Switch | GPIO 26 |
| Gas Sensor Analog | GPIO 34 |
| Buzzer | GPIO 25 |
| Relay MD0070 | GPIO 23 |
| DHT22 | GPIO 4 |
| LDR Analog | GPIO 35 |
| PZEM RX | GPIO 16 |
| PZEM TX | GPIO 17 |

Adjust pins based on your actual wiring.

### Step 5: ESP32 Firebase Responsibilities

The ESP32 should:

1. Connect to WiFi.
2. Connect to Firebase.
3. Read all sensors.
4. Apply safety logic locally.
5. Turn buzzer and relay on/off when gas is detected.
6. Upload latest sensor values to Firebase.
7. Upload history readings periodically.
8. Upload alerts when threshold is crossed.
9. Read device command states from Firebase.
10. Apply relay/device commands.

## 11. ESP32 Safety Logic

Gas detection should be handled locally.

Example logic:

```cpp
if (gasValue > GAS_DANGER_THRESHOLD) {
  buzzerStatus = true;
  relayStatus = true;
} else {
  buzzerStatus = false;
  relayStatus = false;
}
```

If relay is active-low:

```cpp
digitalWrite(RELAY_PIN, relayStatus ? LOW : HIGH);
```

If relay is active-high:

```cpp
digitalWrite(RELAY_PIN, relayStatus ? HIGH : LOW);
```

You must test your relay module before final wiring.

## 12. ESP32 Firebase Pseudocode

```cpp
connectToWiFi();
connectToFirebase();

loop() {
  readPIR();
  readDoorSensor();
  readGasSensor();
  readPZEM();
  readDHT();
  readLDR();

  if (gasValue > threshold) {
    turnBuzzerOn();
    turnRelayOn();
    createGasAlertInFirebase();
  } else {
    turnBuzzerOff();
    turnRelayOff();
  }

  uploadLatestDataToFirebase();

  if (historyIntervalPassed) {
    uploadHistoryDataToFirebase();
  }

  readDeviceCommandsFromFirebase();
  applyDeviceCommands();

  delay(2000);
}
```

## 13. Recommended Update Intervals

| Data Type | Recommended Interval |
| --- | --- |
| Latest sensor values | Every 2 seconds |
| History logs | Every 30 seconds or 1 minute |
| Alerts | Only when condition changes |
| Device command check | Every 1 to 2 seconds |

Do not save every 2-second reading into history permanently. It will create too much data.

## 14. Alert Logic

Recommended alert thresholds:

| Sensor | Warning | Danger |
| --- | --- | --- |
| Gas | `> 400` | `> 500` |
| Water level | `< 30%` | `< 15%` |
| Voltage | `> 240V` | `> 250V` |
| Current | project-specific | project-specific |

Only create a new alert when the state changes from normal to warning/danger.

Example:

```text
normal -> warning: create alert
warning -> danger: create alert
danger -> danger: do not spam alerts
danger -> normal: optional recovery alert
```

## 15. Frontend Pages To Update

### Dashboard Page

File:

```text
src/pages/Index.tsx
```

Replace simulated data with Firebase sensor and device hooks.

### Energy Page

File:

```text
src/pages/Energy.tsx
```

Use Firebase values:

- `voltage`
- `current`
- `power`
- `energy`

### Water Page

File:

```text
src/pages/Water.tsx
```

Use Firebase values:

- `waterLevel`
- `flowRate`
- `waterPump`

### Gas Page

File:

```text
src/pages/Gas.tsx
```

Use Firebase values:

- `gas`
- `pir`
- `buzzerStatus`
- `relayStatus`
- `exhaustFan`
- `motionDetection`

### Control Page

File:

```text
src/pages/Control.tsx
```

Use Firebase device states and update Firebase commands.

### Analytics Page

File:

```text
src/pages/Analytics.tsx
```

Use:

- `latest` for live meters
- `history` for charts

## 16. Testing Plan

### Phase 1: Firebase Manual Test

Before connecting ESP32:

1. Open Firebase Realtime Database.
2. Manually create:

```text
homes/home_001/latest
```

3. Add sample values.
4. Connect React dashboard.
5. Confirm the dashboard updates when Firebase values change.

### Phase 2: ESP32 Sensor Test

Test each sensor separately using Serial Monitor:

- PIR
- Door sensor
- Gas sensor
- PZEM-004T
- DHT22
- LDR
- Relay
- Buzzer

### Phase 3: ESP32 Firebase Write Test

Send only one value first:

```json
{
  "gas": 300
}
```

Confirm it appears in Firebase.

### Phase 4: Full Sensor Upload

Upload all latest values to:

```text
homes/home_001/latest
```

### Phase 5: Dashboard Live Test

Open React dashboard and confirm:

- Sensor values update live.
- Gas warning changes correctly.
- PIR status changes correctly.
- Device states update correctly.

### Phase 6: Device Control Test

From React:

1. Toggle a device.
2. Confirm Firebase value changes.
3. Confirm ESP32 reads the command.
4. Confirm relay/output changes.

### Phase 7: Gas Safety Test

Test gas sensor threshold carefully with safe test conditions.

Expected result:

```text
Gas high
  -> Buzzer ON
  -> Relay ON/OFF according to design
  -> Firebase latest updates
  -> Firebase alert created
  -> React dashboard warning appears
```

## 17. Security Rules for Development

Development rules:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

These are simple but insecure.

## 18. Better Rules for Final Demo

For a controlled FYP demo, restrict data to the `homes` node:

```json
{
  "rules": {
    "homes": {
      "$homeId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

For production, use Firebase Authentication and restrict each user to their own home ID.

## 19. Expected Final Demo Flow

During your viva or demonstration:

1. Start React dashboard.
2. Show Firebase Realtime Database.
3. Power on ESP32.
4. Show sensor values updating live.
5. Trigger PIR sensor.
6. Open/close door sensor.
7. Change light level for LDR.
8. Show PZEM energy values.
9. Trigger gas threshold safely.
10. Show buzzer and relay response.
11. Show alert appearing in dashboard.
12. Toggle device from dashboard.
13. Show Firebase command changing.
14. Show ESP32 output responding.

## 20. Advantages of Firebase for This Project

- No need to build Express APIs.
- No need to manage MongoDB.
- Real-time database updates are built in.
- Easier integration with React.
- Faster FYP implementation.
- Good live demo experience.
- Can later add authentication and hosting.

## 21. Limitations of Firebase

- Less backend control than Node.js.
- Database rules must be configured carefully.
- ESP32 Firebase integration needs correct credentials.
- Frequent writes can increase usage.
- Advanced analytics may need Cloud Functions or export logic.

## 22. Implementation Checklist

### Firebase

- [ ] Create Firebase project.
- [ ] Create Realtime Database.
- [ ] Register web app.
- [ ] Copy Firebase config.
- [ ] Add Firebase environment variables.
- [ ] Create initial database structure.

### React

- [ ] Install Firebase SDK.
- [ ] Create `src/services/firebase.ts`.
- [ ] Create `src/hooks/useFirebaseSensors.ts`.
- [ ] Create `src/hooks/useFirebaseDevices.ts`.
- [ ] Update Dashboard page.
- [ ] Update Energy page.
- [ ] Update Water page.
- [ ] Update Gas page.
- [ ] Update Control page.
- [ ] Update Analytics page.
- [ ] Test with manually edited Firebase values.

### ESP32

- [ ] Install Arduino IDE.
- [ ] Install ESP32 board package.
- [ ] Install required libraries.
- [ ] Test WiFi connection.
- [ ] Test Firebase connection.
- [ ] Test each sensor separately.
- [ ] Test relay separately.
- [ ] Test buzzer separately.
- [ ] Upload latest sensor data.
- [ ] Upload alert data.
- [ ] Read device commands.
- [ ] Apply relay/device commands.

### Final Demo

- [ ] Run React dashboard.
- [ ] Show Firebase live values.
- [ ] Show ESP32 serial output.
- [ ] Demonstrate each sensor.
- [ ] Demonstrate gas alert.
- [ ] Demonstrate relay and buzzer.
- [ ] Demonstrate dashboard control.

## 23. Recommended Development Order

Follow this exact order:

1. Configure Firebase Realtime Database.
2. Add Firebase SDK to React.
3. Manually test dashboard with Firebase values.
4. Create ESP32 Firebase connection.
5. Send one test value from ESP32.
6. Send all sensor values from ESP32.
7. Replace dashboard simulated data.
8. Add Firebase device commands.
9. Make ESP32 read commands.
10. Add gas alert and buzzer/relay logic.
11. Add history data.
12. Improve charts and alert page.
13. Prepare final demo script.

## 24. Important Safety Notes

- Do not connect AC mains wiring through a breadboard.
- Use an optocoupled relay module.
- Use a fuse for AC load testing.
- Use a proper insulated enclosure.
- Keep high-voltage and low-voltage wiring separated.
- Test relay logic with low voltage first.
- Get supervision when working with AC appliances.

## 25. Final Recommendation

Use Firebase Realtime Database as the backend replacement.

Recommended final stack:

```text
ESP32 + Sensors
Arduino IDE Firmware
Firebase Realtime Database
React + Vite Dashboard
```

This is the fastest and cleanest path for integrating actual sensor data into the current project.

