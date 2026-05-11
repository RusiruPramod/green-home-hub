# Project Documentation
## Smart IoT Energy Management System — Tourist Accommodation
### Research Group 12 | ICT 481-6 Capstone | Updated: May 2026

---

## Project Overview

This system is an IoT-based Energy Management System (EMS) for Sri Lankan SME tourist accommodations (villas, guesthouses, homestays). It addresses the research problem of unchecked energy consumption by hotel guests ("behavioral waste") by:

1. **Detecting room vacancy** using a hybrid multi-sensor algorithm (PIR + Reed Switch + CT Sensor)
2. **Automatically shedding non-essential loads** (AC, lights) when rooms are confirmed vacant
3. **Calculating real-time LKR costs** using CEB H-2 Time-of-Use tariff rates
4. **Providing a 2-tier management dashboard** for a Super Admin (system provider) and Hotel Admin (hotel manager)

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  PERCEPTION LAYER                                            │
│  ESP32 + PZEM-004T + PIR + Reed Switch + MQ-2 + DHT22       │
└──────────────────┬───────────────────────────────────────────┘
                   │ WiFi (Firebase REST / WebSocket)
                   ▼
┌──────────────────────────────────────────────────────────────┐
│  NETWORK LAYER                                               │
│  Firebase Realtime Database (Singapore - asia-southeast1)   │
└──────────────────┬───────────────────────────────────────────┘
                   │ Firebase Web SDK
                   ▼
┌──────────────────────────────────────────────────────────────┐
│  APPLICATION LAYER                                           │
│  React + TypeScript Dashboard                                │
│  ┌─────────────────────┐  ┌──────────────────────────────┐  │
│  │ Tier 1: Super Admin │  │ Tier 2: Hotel Admin Dashboard│  │
│  │ /super-admin/*      │  │ /dashboard/*                 │  │
│  └─────────────────────┘  └──────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn-ui, Radix UI |
| Charts | Recharts |
| Icons | lucide-react |
| Routing | react-router-dom |
| Database | Firebase Realtime Database |
| Auth (planned) | Firebase Authentication + Custom Claims |
| Hardware | ESP32, PZEM-004T, PIR, Reed Switch, MQ-2, DHT22 |

---

## Firebase Database Schema

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
      "lastUpdatedBy": "superadmin@system.com",
      "updatedAt": 1715000000
    }
  },
  "properties": {
    "property_001": {
      "rooms": {
        "room_101": {
          "latest": {
            "voltage": 230.4, "current": 1.52, "power": 350, "energy": 2.8,
            "gas": 420, "pir": true, "doorOpen": false,
            "temperature": 29, "humidity": 70, "lightLevel": 650,
            "waterLevel": 78, "flowRate": 12,
            "occupancyState": "OCCUPIED_ACTIVE",
            "updatedAt": 1715000000
          },
          "devices": {
            "lights": true, "waterPump": false,
            "exhaustFan": true, "motionDetection": true,
            "mainRelay": false, "buzzer": false
          }
        }
      },
      "alerts": {
        "alert_id": {
          "type": "gas", "level": "danger",
          "message": "High gas level detected",
          "acknowledged": false, "createdAt": 1715000000
        }
      },
      "history": {
        "reading_id": {
          "roomId": "room_101", "energy": 2.8,
          "pir": true, "doorOpen": false, "createdAt": 1715000000
        }
      },
      "evaluation": {
        "baseline": { "startedAt": null, "totalKwh": 0, "totalLkr": 0 },
        "automated": { "startedAt": null, "totalKwh": 0, "totalLkr": 0 }
      }
    }
  }
}
```

**Key change from earlier versions:** Tariffs are now at `globalSettings/tariffs` (written by Super Admin, read by all Hotel Admins).

---

## 2-Tier Role System

### Tier 1 — Super Admin
- **Who:** System provider (us)
- **Access:** `/super-admin/*`
- **Responsibilities:**
  - Manage all registered hotel properties (add/remove)
  - Set global CEB tariff rates → auto-cascades to ALL hotels
  - View aggregate analytics across all properties
- **Auth:** Firebase Custom Claim `role: "superadmin"`

### Tier 2 — Hotel Admin
- **Who:** Individual hotel manager / owner
- **Access:** `/dashboard/*` (scoped to their `propertyId`)
- **Responsibilities:**
  - Monitor live room sensor data
  - Control room devices (lights, fan, pump)
  - View their property's analytics and history
  - Run thesis evaluation experiments
  - View tariffs (read-only, set by Super Admin)
- **Auth:** Firebase Custom Claim `role: "hotelAdmin"`

---

## Route Structure

```
/login                              → Auth (redirects by role)

/super-admin/overview               → All-properties KPI cards
/super-admin/hotels                 → Manage hotel properties
/super-admin/tariffs                → Global CEB tariff editor
/super-admin/analytics              → Aggregate cross-property charts

/dashboard/                         → Hotel live overview
/dashboard/energy                   → Energy monitoring
/dashboard/water                    → Water level & pump
/dashboard/gas                      → Gas & safety
/dashboard/control                  → Device management
/dashboard/alerts                   → Alert management
/dashboard/analytics                → Property charts (Firebase history)
/dashboard/evaluation               → Thesis experiment module
/dashboard/settings/tariffs         → Tariff viewer (READ-ONLY)
/dashboard/settings                 → Dashboard settings
```

---

## Key Source Files

### Services
| File | Purpose |
|------|---------|
| `src/services/firebase.ts` | Firebase initialization |
| `src/services/realtimeDbService.ts` | All Firebase RTDB read/write functions |
| `src/services/occupancyLogic.ts` | 7-state room occupancy state machine |
| `src/services/automationService.ts` | Auto-control devices based on occupancy state |
| `src/services/costCalculator.ts` | Time-of-Use cost engine (LKR per kWh) |

### Hooks
| File | Purpose |
|------|---------|
| `src/hooks/useFirebaseRealtime.ts` | Live sensor data listener |
| `src/hooks/useHistoryData.ts` | Historical data aggregation from Firebase |

### Pages — Hotel Admin
| File | Route | Status |
|------|-------|--------|
| `src/pages/Index.tsx` | `/dashboard/` | ✅ Done |
| `src/pages/Energy.tsx` | `/dashboard/energy` | ✅ Done |
| `src/pages/Water.tsx` | `/dashboard/water` | ✅ Done |
| `src/pages/Gas.tsx` | `/dashboard/gas` | ✅ Done |
| `src/pages/Control.tsx` | `/dashboard/control` | ✅ Done |
| `src/pages/Alerts.tsx` | `/dashboard/alerts` | ✅ Done |
| `src/pages/Analytics.tsx` | `/dashboard/analytics` | ✅ Done (Firebase) |
| `src/pages/TariffSettings.tsx` | `/dashboard/settings/tariffs` | ✅ Done |
| `src/pages/SettingsPage.tsx` | `/dashboard/settings` | ✅ Done |
| `src/pages/Evaluation.tsx` | `/dashboard/evaluation` | 🔲 Phase 4 |

### Pages — Super Admin
| File | Route | Status |
|------|-------|--------|
| `src/pages/superadmin/Overview.tsx` | `/super-admin/overview` | 🔲 Phase 5 |
| `src/pages/superadmin/Hotels.tsx` | `/super-admin/hotels` | 🔲 Phase 5 |
| `src/pages/superadmin/GlobalTariffs.tsx` | `/super-admin/tariffs` | 🔲 Phase 5 |
| `src/pages/superadmin/AggregateAnalytics.tsx` | `/super-admin/analytics` | 🔲 Phase 5 |

---

## Phase Status Summary

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Security & Stabilization | ✅ Complete |
| 2 | Data Model & Occupancy Logic | ✅ Complete |
| 3 | Cost, Tariffs & Analytics | ✅ Complete |
| 4 | Evaluation Module | 🔲 Next |
| 5 | 2-Tier Auth & Super Admin | 🔲 Planned |
| 6 | ESP32 Firmware | 🔲 Planned |

---

## How to Run Locally

```powershell
cd "c:\Users\pansi\OneDrive - SOFTLABS INNOVATION PVT LTD\Desktop\Capstone project\green-home-hub"
npm install
npm run dev
```

App runs at: `http://localhost:8080`
