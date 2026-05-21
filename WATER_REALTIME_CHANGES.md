# Water Monitoring Real-Time Data Integration - Changes Summary

## Overview
Fixed the water monitoring system to use real Firebase real-time data instead of mock data.

## Key Issues Found & Fixed

### 1. **Firebase Path Mismatch** ✅
- **Problem**: ESP32 firmware writes to `room_001` but frontend was listening to `room_101`
- **Fix**: Updated all paths in `realtimeDbService.ts`:
  - Sensors path: `properties/property_001/rooms/room_001/latest`
  - Devices path: `properties/property_001/rooms/room_001/devices`
  - History path: `properties/property_001/history` (already correct)

### 2. **Mock Data Removal** ✅
Removed hardcoded mock water data from `Water.tsx`:
- Removed: `"Today's Usage", value: "156 L"` → Now uses `todayUsage` from Firebase
- Removed: Hardcoded weekly array `[145, 162, 138, 156, 178, 198, 156]` → Now uses `weeklyUsage` from Firebase

### 3. **New Water Data Service** ✅
Created `src/services/waterService.ts` with:
- `listenWaterHistory()` - Real-time listener for water usage records
- `calculateTodayUsage()` - Calculates today's water consumption from flow rate data
- `getWeeklyWaterUsage()` - Aggregates usage by day for weekly view
- `getAverageFlowRate()` - Calculates average flow rate for recent records

### 4. **New Water Data Hook** ✅
Created `src/hooks/useWaterData.ts` with:
- Real-time subscription to water history
- Auto-calculation of today's usage
- Auto-calculation of weekly aggregation
- Error handling and loading states

### 5. **Real-Time Integration** ✅
Updated `Water.tsx` to:
- Import `useWaterData` hook
- Display actual `todayUsage` instead of "156 L"
- Display actual `weeklyUsage` from Firebase history
- Show real-time `flowRate` from sensors
- Include loading state for water data

## Real-Time Data Flow

```
ESP32 Firmware
    ↓
Firebase RTDB (properties/property_001/rooms/room_001/)
    ↓
├── latest/ (sensor readings)
│   └── waterLevel, flowRate, etc.
│
└── devices/ (control states)
    └── lights, waterPump, exhaustFan, etc.

↓

Frontend Services
├── realtimeDbService.ts (listenSensors, listenDevices)
└── waterService.ts (listenWaterHistory)

↓

Frontend Hooks
├── useFirebaseRealtime() (real-time sensors & devices)
└── useWaterData() (water-specific calculations)

↓

React Components
├── WaterLevelGauge (displays waterLevel, flowRate)
├── Water.tsx (displays todayUsage, weeklyUsage, pumpControl)
└── All updated in real-time
```

## What The User Will See Now

✅ **Real-time Water Tank Level** - Updates as ESP32 sends data
✅ **Real-time Flow Rate** - Updates every 3 seconds from sensor
✅ **Today's Usage** - Calculated from actual flow rate data (no mock "156 L")
✅ **Weekly Usage Graph** - Dynamically built from Firebase history
✅ **Live Pump Control** - Toggle pump and see real state changes
✅ **Water Alerts** - Low water level warning when < 30%

## How to Verify It's Working

1. Open browser console and check for:
   - `💧 Water Data Updated:` messages (real-time updates)
   - `💧 Firebase Sensor Update - Water Data:` messages
   - `💧 Water history updated:` messages

2. Check Firebase Console at `properties/property_001/rooms/room_001/`:
   - Verify `latest/flowRate` and `latest/waterLevel` are updating
   - Verify `devices/waterPump` changes when toggle is used
   - Verify `history/` entries are being created with flow rate data

3. Water page should now show:
   - Dynamic usage numbers based on actual sensor data
   - Real-time flow rate (not fixed)
   - Weekly bars that change as history data updates

## Environment Setup Required

Make sure your `.env.local` has:
```
VITE_FIREBASE_DATABASE_URL=https://YOUR_PROJECT.firebasedatabase.app
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
```

And your Firebase Rules allow:
- Read/Write to `properties/property_001/`
- Real-time listeners on `/latest` and `/devices`
- History append operations for `/history`

---

## 🐛 Outstanding Water Bugs — Found in UI/UX Audit

> These bugs were identified during the full UI/UX consistency audit (May 2026).
> They are **not yet fixed**. Each section below explains the root cause and the exact code needed to fix it.

---

### Bug 1 🔴 — Water Level Gauge Shows Raw Liters as a Percentage

**Severity:** Critical — The gauge is non-functional as a real indicator.

#### Root Cause

`sensorData.waterLevel` (Firebase path: `latest/waterLevel`) is **total accumulated liters** since the ESP32 last rebooted. The ESP32 increments it continuously:

```cpp
// Inside firmware readAllSensors():
readings.waterLevel += (flowRate / 60.0) * (SENSOR_READ_INTERVAL / 1000.0);
```

It grows unboundedly — 100, 500, 1000+ liters over time.

`WaterLevelGauge.tsx` uses this raw value directly as a CSS height percentage:

```tsx
// Current broken code (WaterLevelGauge.tsx)
const fillLevel = Math.min(100, Math.max(0, level)); // 'level' is raw liters
style={{ height: `${fillLevel}%` }}                 // used directly as %
```

So after accumulating just 100 liters, the gauge shows 100% full — permanently. The "Low Water" emergency state (triggered below 20%) can never appear. The gauge is visually broken.

#### Files to Fix

**`src/components/dashboard/WaterLevelGauge.tsx`**

Add a `capacityLiters` prop and normalise the value before using it:

```tsx
// 1. Add to the interface/props
interface WaterLevelGaugeProps {
  level: number;        // total accumulated liters from Firebase
  flowRate: number;
  capacityLiters?: number;  // NEW — physical tank capacity in liters
}

// 2. In component body, normalise to 0–100%
export function WaterLevelGauge({ level, flowRate, capacityLiters = 200 }: WaterLevelGaugeProps) {
  const fillPercent = Math.min(100, Math.max(0, (level / capacityLiters) * 100));
  // Use fillPercent everywhere instead of 'level' for display logic
}

// 3. Update the label to show both liters and capacity
<p>{level.toFixed(1)} L / {capacityLiters} L</p>
<p>{fillPercent.toFixed(0)}%</p>
```

**`src/pages/Water.tsx`** — Pass the capacity prop:

```tsx
<WaterLevelGauge
  level={sensorData.waterLevel}
  flowRate={sensorData.flowRate}
  capacityLiters={200}   // ADD THIS — match your physical tank size
/>
```

**`src/components/dashboard/StatsOverview.tsx`** — Fix the KPI card too:

```tsx
// Current: shows sensorData.waterLevel as a number labelled "L"
// Fix: show the normalised percentage
value: `${Math.min(100, ((sensorData.waterLevel || 0) / 200) * 100).toFixed(0)}%`,
// And change the label from "Water Reserve" to "Tank Level"
```

> **Note:** Define `TANK_CAPACITY_L = 200` as a shared constant in a `config.ts` file
> so you only need to change it in one place if the tank size changes.

---

### Bug 2 🔴 — Auto-Fill Toggles Are Decorative (Not Wired to Firebase)

**Severity:** Critical — The toggles do nothing. This is misleading to any evaluator.

#### Root Cause

`Water.tsx` renders two `<Switch>` components with no `onCheckedChange` handler and no state:

```tsx
// Current broken code (Water.tsx) — purely decorative
<Switch defaultChecked />   {/* no handler — clicking does nothing */}
<Switch defaultChecked />   {/* no handler — clicking does nothing */}
```

`defaultChecked` only sets the initial render value — it is **uncontrolled** and never writes to Firebase. There is no Firebase path that receives these toggle values, and the ESP32 does not read an auto-fill setting.

#### Files to Fix

**Step 1 — Add Firebase write function in `src/services/realtimeDbService.ts`:**

```ts
// Add to realtimeDbService.ts
export const updateWaterAutoFill = async (
  autoFillEnabled: boolean,
  lowThresholdPct: number = 20,
  highThresholdPct: number = 90
): Promise<void> => {
  const settingsRef = ref(realtimeDb, "properties/property_001/settings/waterAutoFill");
  await set(settingsRef, {
    enabled: autoFillEnabled,
    lowThreshold: lowThresholdPct,
    highThreshold: highThresholdPct,
    updatedAt: serverTimestamp(),
  });
};
```

**Step 2 — Add state and Firebase read in `src/pages/Water.tsx`:**

```tsx
// Add inside the Water component
const [autoFillEnabled, setAutoFillEnabled] = useState(false);

// Read current setting from Firebase on mount
useEffect(() => {
  const settingsRef = ref(realtimeDb, "properties/property_001/settings/waterAutoFill");
  const unsub = onValue(settingsRef, (snap) => {
    if (snap.exists()) setAutoFillEnabled(snap.val().enabled ?? false);
  });
  return () => unsub();
}, []);

// Handler that writes to Firebase
const handleAutoFillToggle = async (checked: boolean) => {
  setAutoFillEnabled(checked); // optimistic update
  await updateWaterAutoFill(checked);
};
```

**Step 3 — Wire the `<Switch>` component:**

```tsx
// Replace the broken declarative Switch with a controlled one
<Switch
  checked={autoFillEnabled}
  onCheckedChange={handleAutoFillToggle}
/>
```

**Step 4 — Read the setting in the ESP32 firmware (optional, for full automation):**

```cpp
// In listenForDeviceCommands() or a new listenWaterSettings() function:
if (Firebase.RTDB.getBool(&fbdo, "properties/property_001/settings/waterAutoFill/enabled")) {
  bool autoFill = fbdo.boolData();
  // If autoFill is true and waterLevel < lowThreshold → turn pump ON
  // If waterLevel > highThreshold → turn pump OFF
}
```

---

### Bug 3 🟠 — "Today's Usage" Shows Cumulative Total, Not Daily Delta

**Severity:** High — The number shown is not a daily figure; it grows infinitely.

#### Root Cause

`waterService.ts` / `useWaterData.ts` calculates `todayUsage` by summing `flowRate` records in the Firebase history that have today's date. However, the flow meter (`YF-S402`) and the ESP32 accumulate `waterLevel` as a running total since boot. There is no daily reset mechanism. If the ESP32 has been running for 3 days and has accumulated 450 liters total, the page shows "450 L" as "Today's Usage" when the real daily usage might be 150 L.

The correct approach for daily usage is: **delta between first and last `waterLevel` reading of the current calendar day**.

#### Files to Fix

**`src/hooks/useWaterData.ts`** — Fix the daily usage calculation:

```ts
// Current broken approach — sums all records
const calculateTodayUsage = (records: WaterRecord[]): number => {
  const today = new Date().toDateString();
  return records
    .filter(r => new Date(r.createdAt).toDateString() === today)
    .reduce((sum, r) => sum + r.flowRate, 0); // ❌ sums flow rates, not delta
};

// Fixed approach — delta between first and last waterLevel reading today
const calculateTodayUsage = (records: WaterRecord[]): number => {
  const today = new Date().toDateString();
  const todayRecords = records
    .filter(r => new Date(r.createdAt).toDateString() === today)
    .sort((a, b) => a.createdAt - b.createdAt); // sort ascending

  if (todayRecords.length < 2) return 0; // not enough data

  const firstReading = todayRecords[0].waterLevel;
  const lastReading  = todayRecords[todayRecords.length - 1].waterLevel;

  return Math.max(0, lastReading - firstReading); // delta in liters
};
```

**`src/pages/Water.tsx`** — Update label to clarify the unit:

```tsx
// Change the label to make the unit explicit
<p className="text-2xl font-mono font-bold">
  {todayUsage.toFixed(1)} L
</p>
<p className="text-xs text-muted-foreground">Consumed today (delta)</p>
```

**Alternative simpler fix (if history schema cannot be changed):**

Store a `dailyBaseline` value in Firebase at midnight (or on ESP32 reboot each day):

```ts
// Firebase path: properties/property_001/rooms/room_001/dailyBaseline
// Set to current waterLevel at the start of each day
// Today's usage = current waterLevel - dailyBaseline
```

---

## Summary Table — Water Bug Status

| Bug | Severity | Status | Files Affected |
|-----|----------|--------|----------------|
| Water level gauge shows raw liters as % | 🔴 Critical | ❌ Not Fixed | `WaterLevelGauge.tsx`, `Water.tsx`, `StatsOverview.tsx` |
| Auto-Fill toggles are decorative | 🔴 Critical | ❌ Not Fixed | `Water.tsx`, `realtimeDbService.ts` |
| Today's Usage shows cumulative total | 🟠 High | ❌ Not Fixed | `useWaterData.ts`, `Water.tsx` |
| Firebase path mismatch (`room_101` vs `room_001`) | 🔴 Critical | ✅ Fixed | `realtimeDbService.ts` |
| Mock data hardcoded in Water.tsx | 🟡 Medium | ✅ Fixed | `Water.tsx` |
| New `waterService.ts` and `useWaterData.ts` created | — | ✅ Done | — |
