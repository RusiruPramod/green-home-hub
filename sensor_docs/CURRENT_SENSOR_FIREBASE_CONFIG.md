# Configuring the Current Sensor Firmware with Firebase

**Project:** Green Home Hub
**Firmware file:** [`firmware/Final_code/Final_code.ino`](../firmware/Final_code/Final_code.ino)
**Frontend config:** [`src/services/firebase.ts`](../src/services/firebase.ts) + `.env`
**Last Updated:** June 23, 2026

> This is a **task-focused, step-by-step** guide for wiring **the firmware you are running right now**
> (`Final_code.ino`) to **your own** Firebase Realtime Database.
> For the full sensor catalog / wiring reference, see
> [`FIREBASE_SENSOR_SETUP_GUIDE.md`](./FIREBASE_SENSOR_SETUP_GUIDE.md) and
> [`../ARDUINO_FIREBASE_DATA_SPEC.md`](../ARDUINO_FIREBASE_DATA_SPEC.md).

---

## What this firmware does (so you know what to expect)

`Final_code.ino` is an ESP32 node that:

- Reads: water flow (GPIO35), water level (GPIO34), gas (GPIO32), door (GPIO33), PIR (GPIO27),
  ultrasonic distance (GPIO18/19), DHT11 temp/humidity (GPIO4).
- Drives: gas relay + buzzer (GPIO26 / GPIO25), human-presence relay (GPIO14), status LED (GPIO23).
- **Authenticates anonymously** to Firebase (`Firebase.signUp(&config, &auth, "", "")`).
- **Pushes telemetry every 3 seconds** to
  `properties/property_001/rooms/room_001/latest`.
- **Appends flow history** (only while water flows) to
  `properties/property_001/history`.

It currently does **not** read the `devices/` control path back from Firebase — control is one-way
(sensor → cloud) in this sketch.

---

## Step 0 — Prerequisites (one-time)

- Arduino IDE with the **ESP32 board package** installed (Boards Manager → "esp32" by Espressif).
- These libraries (Library Manager → search & install):

  | Library | Author | Notes |
  |---|---|---|
  | **Firebase Arduino Client Library for ESP8266 and ESP32** | Mobizt | provides `Firebase_ESP_Client.h`, `addons/TokenHelper.h`, `addons/RTDBHelper.h` — required by this sketch |
  | **DHT sensor library** | Adafruit | for the DHT11 |
  | **Adafruit Unified Sensor** | Adafruit | dependency of the DHT library |

  > ⚠️ Use the **Mobizt "Firebase Client"** library, *not* the older `FirebaseESP32`.
  > This sketch includes `Firebase_ESP_Client.h` — the wrong library will not compile.

---

## Step 1 — Create / open your Firebase project

1. Go to the [Firebase Console](https://console.firebase.google.com/) → **Add project** (or open an existing one).
2. Give it a name (e.g. `green-home-hub`) and finish the wizard.

---

## Step 2 — Create the Realtime Database

1. Left sidebar → **Build → Realtime Database** → **Create Database**.
2. Pick a **location** (e.g. `asia-southeast1` — matches the region used in the sample firmware).
3. Start in **Test mode** for now (we lock it down in Step 7).

After creation, copy the **database URL** shown at the top. It looks like:

```
https://YOUR-PROJECT-default-rtdb.asia-southeast1.firebasedatabase.app/
```

You'll paste this into both the firmware and the frontend.

---

## Step 3 — Enable Anonymous Authentication ⭐ (don't skip)

This sketch logs in with `Firebase.signUp(&config, &auth, "", "")` — that is an **anonymous**
sign-in. If anonymous auth is disabled, the ESP32 will print `Firebase Signup Failed` and never upload.

1. Left sidebar → **Build → Authentication** → **Get started**.
2. **Sign-in method** tab → **Anonymous** → **Enable** → **Save**.

---

## Step 4 — Get your API key + Database URL

1. ⚙️ **Project Settings** → **General** tab.
2. Under **Your apps**, add a **Web app** (`</>`) if you don't have one (name it `green-home-hub-frontend`).
3. From the generated `firebaseConfig`, note:
   - `apiKey`  → this is your **Web API Key**
   - `databaseURL` → from Step 2

> The ESP32 and the web dashboard use the **same** `apiKey` and `databaseURL`.

---

## Step 5 — Put your credentials into the firmware

Open [`firmware/Final_code/Final_code.ino`](../firmware/Final_code/Final_code.ino) and edit the
top of the file.

**5a. WiFi** ([lines 10–11](../firmware/Final_code/Final_code.ino#L10-L11)) — must be a **2.4 GHz** network:

```cpp
#define WIFI_SSID     "YOUR_WIFI_NAME"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
```

**5b. Firebase** ([lines 16–17](../firmware/Final_code/Final_code.ino#L16-L17)) — replace the sample
project values with **yours**:

```cpp
#define API_KEY "AIzaSyCO7vsvUvYaLI11r9wjztYuMIteG4AorrY"
#define DATABASE_URL "https://esp32led-b6105-c0b99-default-rtdb.asia-southeast1.firebasedatabase.app/"

```

**5c. (Optional) Device identifiers** ([lines 32–33](../firmware/Final_code/Final_code.ino#L32-L33)) —
only change if this node is a different room/property:

```cpp
String propertyId = "property_001";
String roomId     = "room_001";
```

> Whatever you set here defines the database path:
> `properties/<propertyId>/rooms/<roomId>/latest`. The frontend must read the **same** path.

---

## Step 6 — Upload and verify on the Serial Monitor

1. **Tools → Board** → your ESP32 (e.g. "ESP32 Dev Module").
2. **Tools → Port** → the COM port of your board (Windows, e.g. `COM3`).
3. Click **Upload**.
4. Open **Serial Monitor** at **115200 baud**.

**Healthy output looks like:**

```
 DHT11 Sensor Started
 Connecting WiFi....
 WiFi Connected
IP Address: 192.168.x.x
 Firebase Signup OK
 Smart Hotel System Ready!
...
✅ Data uploaded to Firebase
   - Temperature: 24.5 °C
   - Humidity: 55 %
   - Distance: 120.0 cm
```

- `Firebase Signup OK` → anonymous auth (Step 3) is working.
- `✅ Data uploaded to Firebase` (every ~3 s) → telemetry is flowing.

Then open the **Firebase Console → Realtime Database** and confirm this tree is filling in and the
`updatedAt` value keeps changing:

```
properties/property_001/rooms/room_001/latest
  ├─ flowRate, totalLiters, waterLevel
  ├─ gas
  ├─ doorState, motionDetected, humanPresent
  ├─ distance, proximityStatus
  ├─ temperature, temperatureStatus
  ├─ humidity, humidityStatus
  └─ updatedAt        (server timestamp)
```

---

## Step 7 — Lock down the security rules

Test mode expires and is unsafe. Since the node signs in anonymously (so `auth != null` is true),
use authenticated rules:

```json
{
  "rules": {
    "properties": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

Paste into **Realtime Database → Rules → Publish**. The ESP32 (anonymous auth) and the logged-in
web dashboard both satisfy `auth != null`.

---

## Step 8 — Point the web dashboard at the same project

1. Copy `.env.example` to `.env` in the project root (if you haven't already).
2. Fill in the values from the **same** `firebaseConfig` (Step 4):

```env
VITE_FIREBASE_API_KEY=YOUR_FIREBASE_WEB_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR-PROJECT.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://YOUR-PROJECT-default-rtdb.asia-southeast1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=YOUR-PROJECT
VITE_FIREBASE_STORAGE_BUCKET=YOUR-PROJECT.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

3. Restart the dev server so Vite re-reads `.env`:

```bash
npm install
npm run dev
```

> `src/services/firebase.ts` validates these vars on boot and logs a clear
> "Missing Firebase environment variables" error if any are blank — check the browser console (F12).

---

## Quick troubleshooting

| Symptom (Serial / Console) | Likely cause | Fix |
|---|---|---|
| `Firebase Signup Failed` | Anonymous auth disabled, or wrong `API_KEY` | Do **Step 3**; re-check `API_KEY` (Step 5b) |
| Stuck on `Connecting WiFi....` then `WiFi Failed` | Wrong creds / 5 GHz network | Fix SSID/pass; use a **2.4 GHz** SSID |
| `❌ Firebase upload failed: ...` | Rules deny write, or bad `DATABASE_URL` | Confirm rules (Step 7) and the full URL incl. region |
| Uploads OK but dashboard empty | `.env` not set / wrong path / server not restarted | Step 8; ensure `propertyId`/`roomId` match the UI |
| `❌ DHT11 Read Failed` | DHT wiring / wrong sensor type | Check GPIO4 wiring; sketch expects **DHT11** (not DHT22) |
| Compile error on `Firebase_ESP_Client.h` | Wrong library installed | Install **Mobizt** "Firebase Client" (Step 0) |

---

## At-a-glance checklist

- [ ] ESP32 board package + Mobizt Firebase + Adafruit DHT libraries installed
- [ ] Realtime Database created; database URL copied
- [ ] **Anonymous** sign-in enabled
- [ ] `WIFI_SSID` / `WIFI_PASSWORD` set (2.4 GHz)
- [ ] `API_KEY` / `DATABASE_URL` set in firmware
- [ ] Serial shows `Firebase Signup OK` + `✅ Data uploaded`
- [ ] Data visible under `properties/property_001/rooms/room_001/latest`
- [ ] Security rules published (`auth != null`)
- [ ] `.env` filled with matching `VITE_FIREBASE_*` and dev server restarted
