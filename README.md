# Smart IoT Energy Management System
### Tourist Accommodation Energy Management — Research Group 12

A 2-tier IoT-based Energy Management System for Sri Lankan tourist accommodations (SMEs), built as part of an ICT 481-6 Capstone project. The system uses a hybrid occupancy detection algorithm to automate energy-saving actions and calculate real-time LKR costs using CEB Time-of-Use tariffs.

---

## Architecture Overview

```
ESP32 Edge Node  →  Firebase Realtime Database  →  React Web Dashboard
  (Sensors +             (Live sync,                (Hotel Admin +
   Relays)               history, alerts)            Super Admin)
```

### 2-Tier Role System

| Tier | Role | Access |
|------|------|--------|
| **Tier 1** | Super Admin (System Provider) | Manages all hotel properties, sets global CEB tariff rates |
| **Tier 2** | Hotel Admin (Hotel Manager) | Monitors their property, controls devices, views analytics |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend Framework | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn-ui |
| Charts | Recharts |
| Icons | lucide-react |
| Routing | react-router-dom |
| Database | Firebase Realtime Database |
| Auth (planned) | Firebase Authentication (Custom Claims) |

---

## Quick Start

### Prerequisites
- Node.js v18 or higher
- Firebase project (already configured — see `.env`)

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
The `.env` file is already configured. It should contain:
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_URL=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 3. Run Development Server
```bash
npm run dev
```
App runs at: `http://localhost:8080`

---

## Firebase Database Structure

```json
{
  "globalSettings": {
    "tariffs": {
      "category": "H-2",
      "currency": "LKR",
      "fixedCharge": 5000,
      "offPeak": { "start": "22:30", "end": "05:30", "rate": 12.00 },
      "day":     { "start": "05:30", "end": "18:30", "rate": 15.00 },
      "peak":    { "start": "18:30", "end": "22:30", "rate": 28.00 },
      "updatedAt": 1715000000
    }
  },
  "properties": {
    "property_001": {
      "rooms": {
        "room_101": {
          "latest": { "voltage": 230.4, "energy": 2.8, "pir": true, "doorOpen": false, "occupancyState": "OCCUPIED_ACTIVE" },
          "devices": { "lights": true, "waterPump": false, "exhaustFan": true }
        }
      },
      "alerts": { "alert_id": { "type": "gas", "acknowledged": false } },
      "history": { "reading_id": { "energy": 2.8, "createdAt": 1715000000 } },
      "evaluation": { "baseline": {}, "automated": {} }
    }
  }
}
```

---

## Current Routes (Hotel Admin Dashboard)

| Route | Page | Status |
|-------|------|--------|
| `/` | Dashboard — Live overview | ✅ Live |
| `/energy` | Energy monitoring | ✅ Live |
| `/water` | Water level & pump | ✅ Live |
| `/gas` | Gas & safety | ✅ Live |
| `/control` | Device management | ✅ Live |
| `/alerts` | Alert management | ✅ Live |
| `/analytics` | Charts & history | ✅ Live (Firebase) |
| `/settings/tariffs` | Tariff configuration | ✅ Live (Firebase) |
| `/settings` | Dashboard settings | ✅ Live |
| `/evaluation` | Thesis experiment module | 🔲 Phase 4 |
| `/login` | Role-based auth | 🔲 Phase 5 |
| `/super-admin/*` | Super Admin portal | 🔲 Phase 5 |

---

## Key Services & Hooks

| File | Purpose |
|------|---------|
| `src/services/firebase.ts` | Firebase app init |
| `src/services/realtimeDbService.ts` | All Firebase read/write operations |
| `src/services/occupancyLogic.ts` | 7-state room occupancy state machine |
| `src/services/automationService.ts` | Auto-shed devices on vacancy, logs `automated: true` |
| `src/services/costCalculator.ts` | Dynamic ToU cost engine (LKR per kWh) |
| `src/hooks/useFirebaseRealtime.ts` | Live sensor data hook |
| `src/hooks/useHistoryData.ts` | Historical data aggregation from Firebase |

---

## Occupancy State Machine

The hybrid occupancy detection algorithm (PIR + Reed Switch) uses 7 states:

```
VACANT → ENTRY_DETECTED → OCCUPIED_ACTIVE
                                ↓
                         OCCUPIED_IDLE → OCCUPIED_SLEEPING
                                ↓
                         EXIT_PENDING → VACANT_CONFIRMED → VACANT
```

On `VACANT_CONFIRMED`: `automationService.ts` automatically turns off lights, fan, and non-essential devices.

---

## CEB Tariff Rates (H-2 Hotel Category — May 2026)

| Block | Time | Rate |
|-------|------|------|
| Off-Peak | 22:30 – 05:30 | LKR 12.00/kWh |
| Day | 05:30 – 18:30 | LKR 15.00/kWh |
| Peak | 18:30 – 22:30 | LKR 28.00/kWh |
| Fixed Monthly | — | LKR 5,000 |

> Rates are exempted from the May 2026 18% PUCSL hike (H-1/H-2 hotel exemption).

---

## Project Phases

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Security & Stabilization | ✅ Done |
| 2 | Data Model & Occupancy Logic | ✅ Done |
| 3 | Cost, Tariffs & Analytics | ✅ Done |
| 4 | Evaluation Module (Thesis) | 🔲 Next |
| 5 | 2-Tier Auth & Super Admin | 🔲 Planned |
| 6 | ESP32 Firmware | 🔲 Planned |
