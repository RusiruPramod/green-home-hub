# Proposal Gap Analysis and Functional Requirements

## 1. Document Purpose

This document compares the current Green Home Hub project implementation with the research proposal:

```text
Research_Project_Proposal_group_12.pdf
```

Proposal title:

```text
Smart IoT-Based Energy Management System for Tourist Accommodation in Sri Lanka
```

The purpose of this document is to:

- Identify what the proposal expects.
- Identify what the current project already implements.
- Identify missing or partially implemented features.
- Define clear functional requirements for the next development phase.
- Align the project with the final year project research goals.

## 2. Proposal Summary

The proposal targets small and medium tourist accommodations in Sri Lanka, such as villas, guest houses, and homestays.

The core problem is excessive electricity consumption caused by guests leaving high-consumption appliances running while rooms are unoccupied.

The proposed system is an IoT-based Energy Management System that:

- Detects room occupancy using sensors.
- Automatically controls appliances through relays.
- Monitors energy usage.
- Calculates cost savings using CEB tariff rates.
- Provides a secure web dashboard.
- Allows manual override by property owners.
- Evaluates energy savings through before-and-after testing.

## 3. Proposal Objectives

The proposal defines the following specific objectives:

| Objective ID | Proposal Objective |
| --- | --- |
| OBJ-01 | Design a hardware sensor node capable of accurately detecting human presence in a hotel room environment without false negatives, especially sleeping guests. |
| OBJ-02 | Develop a secure web-based dashboard for real-time monitoring and manual override of room appliances. |
| OBJ-03 | Implement an algorithm that calculates estimated cost savings based on current CEB tariff rates. |
| OBJ-04 | Evaluate system effectiveness by comparing energy usage before and after implementation in a test scenario. |

## 4. Current Project State

Current branch:

```text
dev-rusiru
```

Current frontend stack:

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn-ui / Radix UI
- Recharts
- Firebase Realtime Database

The current project includes:

- Dashboard page
- Energy page
- Water page
- Gas and safety page
- Device control page
- Alerts page
- Analytics page
- API services page
- Settings page

Current Firebase-related files:

```text
src/services/firebase.ts
src/services/realtimeDbService.ts
src/hooks/useMQTTSimulation.ts
FIREBASE_SETUP.md
```

Important note:

`useMQTTSimulation.ts` is no longer only a simulation hook in the current branch. It now listens to Firebase Realtime Database through `realtimeDbService.ts`, but the file name is misleading.

## 5. Current Firebase Data Model

The current app expects Firebase nodes similar to:

```json
{
  "sensors": {
    "gas": 0,
    "water": 0,
    "voltage": 0,
    "current": 0,
    "power": 0,
    "motion": false,
    "flowRate": 0,
    "updatedAt": 0
  },
  "devices": {
    "light": false,
    "pump": false,
    "fan": false,
    "motionDetection": false,
    "updatedAt": 0
  },
  "alerts": {},
  "led": 0
}
```

Current supported live data:

- Gas value
- Water level
- Voltage
- Current
- Power
- Motion status
- Flow rate
- Light state
- Pump state
- Fan state
- Motion detection state
- LED state
- Alert list

## 6. Proposal vs Current Project Gap Summary

| Area | Proposal Expectation | Current State | Gap Status |
| --- | --- | --- | --- |
| Tourist accommodation focus | Room-based energy management for villas/guesthouses | Generic smart home dashboard | Partial |
| Occupancy detection | Hybrid occupancy detection using PIR, door sensor, and possibly current/other sensors | Motion boolean only | Major gap |
| False negative handling | Avoid turning off appliances while guest sleeps or stays still | No room-state algorithm yet | Major gap |
| Appliance automation | Auto cut power to non-essential appliances when vacant | Manual device toggles exist | Partial |
| Energy monitoring | kWh, power usage, cost analysis | Voltage/current/power displayed; many stats hardcoded | Partial |
| CEB tariff algorithm | Time-of-use tariff-based saving calculation | Static cost saving card only | Major gap |
| Real-time dashboard | Web dashboard with live monitoring | Implemented with Firebase listeners | Mostly implemented |
| Manual override | Property owner can manually control appliances | Device toggles exist | Partial |
| Secure dashboard | Secure web dashboard | No authentication or role-based access | Major gap |
| Backend/database | Proposal says MERN + MQTT | Current project uses Firebase RTDB | Architecture changed |
| MQTT communication | Lightweight MQTT between nodes and server | Firebase RTDB direct sync | Changed approach |
| Experiment evaluation | Pre-test/post-test 24-hour comparison | No baseline/experiment module | Major gap |
| Alerts | Useful for operational monitoring | Firebase alerts exist; gas/water threshold alerts exist | Partial |
| Gas safety | Not core proposal, but user added gas detector, buzzer, relay | Gas dashboard and alerts exist | Partial |
| Hardware integration | ESP32, PIR, relays, energy sensor | Frontend prepared; firmware not in repo | Major gap |

## 7. High-Level Gap Analysis

### 7.1 Business Context Gap

The proposal is specifically about tourist accommodation energy management. The current app is branded as an IoT home dashboard and uses labels like:

- IoT Home
- Smart Monitoring
- Living Room Lights
- Water Pump
- Exhaust Fan
- Motion Detection

Gap:

The UI does not yet clearly represent rooms, tourist accommodation units, villas, or guesthouse operations.

Required change:

Add room-based concepts:

- Property
- Room
- Occupancy status
- Room appliances
- Room energy usage
- Room cost savings

### 7.2 Occupancy Detection Gap

The proposal emphasizes hybrid occupancy detection to reduce false negatives.

Expected sensors:

- PIR motion sensor
- Magnetic door sensor / reed switch
- Optional ultrasonic sensor
- Possible energy/current pattern support

Current state:

- Only `motion` exists in Firebase sensor data.
- No `doorOpen` field.
- No `ultrasonicPresence` field.
- No `roomState` field.
- No occupancy confidence score.
- No sleeping/idle guest handling.

Required change:

Add a room-state algorithm that converts raw sensor data into meaningful occupancy states.

Recommended room states:

```text
VACANT
ENTRY_DETECTED
OCCUPIED_ACTIVE
OCCUPIED_IDLE
OCCUPIED_SLEEPING
EXIT_PENDING
VACANT_CONFIRMED
```

### 7.3 Automation Gap

The proposal expects automatic appliance control based on occupancy.

Current state:

- Manual toggles exist for light, pump, fan, and motion detection.
- No automatic shutoff rules based on occupancy.
- No delay timers.
- No appliance priority categories.
- No room vacancy timeout.

Required change:

Implement automation rules such as:

- Turn off non-essential appliances after vacancy confirmation.
- Keep essential or safety appliances active.
- Allow owner override.
- Add delay before cutting power to avoid false shutoff.

### 7.4 Cost Saving Gap

The proposal highlights real-time ROI and cost-saving calculation based on CEB tariff rates.

Current state:

- `StatsOverview.tsx` displays static values such as cost savings.
- No tariff configuration.
- No time-of-use calculation.
- No kWh history used for cost.
- No before/after comparison.

Required change:

Implement CEB tariff calculation module.

Minimum expected calculation:

```text
energy_cost = consumed_kWh * tariff_rate
saving = baseline_cost - automated_cost
```

Better calculation:

```text
cost = off_peak_kWh * off_peak_rate
     + day_kWh * day_rate
     + peak_kWh * peak_rate
```

### 7.5 Experiment and Validation Gap

The proposal requires a comparative pre-test/post-test design.

Expected validation:

- 24-hour baseline without automation.
- 24-hour experimental run with automation.
- Compare kWh and LKR cost.
- Success if at least 20% wastage reduction is achieved.

Current state:

- No baseline recording.
- No experiment mode.
- No test scenario management.
- No comparative report.

Required change:

Add experiment logging and comparison screens.

### 7.6 Security Gap

The proposal requires a secure web dashboard.

Current state:

- No login.
- Firebase config is currently hardcoded in `src/services/firebase.ts`.
- Development Firebase rules may allow open read/write.
- No user roles.

Required change:

Add:

- Firebase Authentication.
- Owner login.
- Role-based permissions if needed.
- Environment-based Firebase config.
- Restricted Firebase rules.

### 7.7 Data Model Gap

Current Firebase structure is flat:

```text
sensors
devices
alerts
led
```

This is enough for one prototype board but not enough for tourist accommodation rooms.

Required structure should support:

- Multiple properties
- Multiple rooms
- Multiple devices per room
- Sensor history
- Alerts
- Tariff settings
- Experiment sessions

Recommended structure:

```json
{
  "properties": {
    "property_001": {
      "name": "Demo Villa",
      "rooms": {
        "room_101": {
          "latest": {
            "voltage": 230,
            "current": 1.5,
            "power": 350,
            "energy": 2.8,
            "gas": 300,
            "pir": false,
            "doorOpen": false,
            "ultrasonicPresence": false,
            "occupancyState": "VACANT",
            "updatedAt": 1710000000
          },
          "devices": {
            "light": false,
            "fan": false,
            "ac": false,
            "geyser": false,
            "safetyRelay": false,
            "buzzer": false
          }
        }
      },
      "tariffs": {
        "offPeakRate": 0,
        "dayRate": 0,
        "peakRate": 0
      },
      "alerts": {},
      "experiments": {}
    }
  }
}
```

## 8. Functional Requirements

This section defines the functional requirements needed to align the project with the proposal.

Priority levels:

- Must: required for final prototype and proposal alignment.
- Should: important for strong evaluation and viva.
- Could: useful enhancement if time permits.

## 9. Sensor Data Functional Requirements

| ID | Requirement | Priority | Current Status |
| --- | --- | --- | --- |
| FR-SEN-01 | The system shall receive real-time sensor readings from an ESP32 device. | Must | Partial |
| FR-SEN-02 | The system shall store latest voltage, current, power, and energy values from the energy meter. | Must | Partial; energy kWh missing |
| FR-SEN-03 | The system shall receive PIR motion status from the ESP32. | Must | Partial |
| FR-SEN-04 | The system shall receive door open/close status from a magnetic reed switch. | Must | Missing |
| FR-SEN-05 | The system shall optionally receive ultrasonic presence data to reduce false negatives. | Should | Missing |
| FR-SEN-06 | The system shall receive gas sensor values from the ESP32. | Must | Partial |
| FR-SEN-07 | The system shall receive relay status and buzzer status from the ESP32. | Must | Partial |
| FR-SEN-08 | The system shall timestamp each sensor update. | Must | Partial |
| FR-SEN-09 | The system shall maintain historical sensor logs for analysis. | Must | Missing |
| FR-SEN-10 | The system shall validate that incoming sensor values are within expected ranges. | Should | Missing |

## 10. Occupancy Detection Functional Requirements

| ID | Requirement | Priority | Current Status |
| --- | --- | --- | --- |
| FR-OCC-01 | The system shall determine room occupancy using PIR motion and door sensor data. | Must | Missing |
| FR-OCC-02 | The system shall support room states beyond occupied/vacant. | Must | Missing |
| FR-OCC-03 | The system shall avoid false vacancy detection when a guest is sleeping or stationary. | Must | Missing |
| FR-OCC-04 | The system shall apply a configurable vacancy timeout before turning off appliances. | Must | Missing |
| FR-OCC-05 | The system shall record occupancy state changes with timestamps. | Should | Missing |
| FR-OCC-06 | The system shall display current occupancy status on the dashboard. | Must | Missing |
| FR-OCC-07 | The system shall calculate occupancy duration per room. | Should | Missing |
| FR-OCC-08 | The system shall allow tuning of sensor thresholds and timeout values. | Should | Missing |

Recommended occupancy logic:

```text
IF door opens AND motion is detected:
  roomState = OCCUPIED_ACTIVE

IF no motion for configured time AND door has not opened:
  roomState = OCCUPIED_IDLE

IF no motion for long time but room was previously occupied:
  roomState = OCCUPIED_SLEEPING

IF door opens after occupied state AND no motion is detected after timeout:
  roomState = VACANT_CONFIRMED

IF roomState = VACANT_CONFIRMED:
  turn off non-essential appliances
```

## 11. Appliance Control Functional Requirements

| ID | Requirement | Priority | Current Status |
| --- | --- | --- | --- |
| FR-CTL-01 | The system shall allow owners to manually turn appliances on/off from the dashboard. | Must | Partial |
| FR-CTL-02 | The system shall write appliance commands to Firebase. | Must | Implemented for current devices |
| FR-CTL-03 | The ESP32 shall read appliance command states from Firebase. | Must | Not in frontend repo |
| FR-CTL-04 | The system shall automatically turn off non-essential appliances when a room is vacant. | Must | Missing |
| FR-CTL-05 | The system shall support appliance categories: essential, non-essential, and safety. | Should | Missing |
| FR-CTL-06 | The system shall allow manual override of automation. | Must | Partial |
| FR-CTL-07 | The system shall show command status and actual device feedback separately. | Should | Partial through LED status only |
| FR-CTL-08 | The system shall log every manual and automatic control action. | Should | Missing |

Recommended device categories:

| Category | Examples | Automation Behavior |
| --- | --- | --- |
| Non-essential | Lights, AC, fan, geyser | Can be turned off when vacant |
| Essential | Router, security device | Should remain on |
| Safety | Gas relay, buzzer, exhaust fan | Controlled by safety rules |

## 12. Energy Monitoring Functional Requirements

| ID | Requirement | Priority | Current Status |
| --- | --- | --- | --- |
| FR-ENE-01 | The system shall display live voltage. | Must | Implemented |
| FR-ENE-02 | The system shall display live current. | Must | Implemented |
| FR-ENE-03 | The system shall display live power in watts. | Must | Implemented |
| FR-ENE-04 | The system shall display accumulated energy in kWh. | Must | Missing |
| FR-ENE-05 | The system shall store energy readings for historical analysis. | Must | Missing |
| FR-ENE-06 | The system shall show energy usage by room. | Must | Missing |
| FR-ENE-07 | The system shall show daily, weekly, and monthly usage. | Should | Partial; mostly static UI |
| FR-ENE-08 | The system shall calculate unoccupied appliance runtime. | Must | Missing |

## 13. Tariff and Cost Saving Functional Requirements

| ID | Requirement | Priority | Current Status |
| --- | --- | --- | --- |
| FR-COST-01 | The system shall store configurable CEB tariff rates. | Must | Missing |
| FR-COST-02 | The system shall calculate electricity cost from kWh usage. | Must | Missing |
| FR-COST-03 | The system shall support time-of-use tariff windows. | Must | Missing |
| FR-COST-04 | The system shall calculate estimated savings caused by automation. | Must | Missing |
| FR-COST-05 | The dashboard shall display money saved in LKR. | Must | Partial; static value only |
| FR-COST-06 | The system shall show peak-time savings separately. | Should | Missing |
| FR-COST-07 | The system shall allow tariff updates from settings. | Should | Missing |

Recommended tariff fields:

```json
{
  "tariffs": {
    "currency": "LKR",
    "offPeak": {
      "start": "22:30",
      "end": "05:30",
      "rate": 0
    },
    "day": {
      "start": "05:30",
      "end": "18:30",
      "rate": 0
    },
    "peak": {
      "start": "18:30",
      "end": "22:30",
      "rate": 0
    }
  }
}
```

## 14. Alert and Safety Functional Requirements

| ID | Requirement | Priority | Current Status |
| --- | --- | --- | --- |
| FR-ALT-01 | The system shall create an alert when gas exceeds warning threshold. | Must | Partial |
| FR-ALT-02 | The system shall create a critical alert when gas exceeds danger threshold. | Must | Partial |
| FR-ALT-03 | The ESP32 shall immediately activate buzzer when gas danger is detected. | Must | Not in frontend repo |
| FR-ALT-04 | The ESP32 shall immediately trigger the safety relay when gas danger is detected. | Must | Not in frontend repo |
| FR-ALT-05 | The dashboard shall show active alerts in real time. | Must | Implemented |
| FR-ALT-06 | The dashboard shall allow alerts to be acknowledged. | Should | Service exists; dashboard panel partial |
| FR-ALT-07 | The system shall avoid repeated duplicate alerts during the same incident. | Should | Partial |
| FR-ALT-08 | The system shall log recovery from danger state. | Could | Missing |

Important safety rule:

Gas response must happen locally on ESP32 before Firebase upload.

## 15. Dashboard Functional Requirements

| ID | Requirement | Priority | Current Status |
| --- | --- | --- | --- |
| FR-UI-01 | The dashboard shall show live sensor values. | Must | Implemented |
| FR-UI-02 | The dashboard shall show room occupancy status. | Must | Missing |
| FR-UI-03 | The dashboard shall show appliance state per room. | Must | Partial |
| FR-UI-04 | The dashboard shall allow manual appliance override. | Must | Partial |
| FR-UI-05 | The dashboard shall show live alerts. | Must | Implemented |
| FR-UI-06 | The dashboard shall show energy charts based on real history. | Must | Partial; chart uses local points |
| FR-UI-07 | The dashboard shall show cost savings based on tariff algorithm. | Must | Missing |
| FR-UI-08 | The dashboard shall support property/room selection. | Should | Missing |
| FR-UI-09 | The dashboard shall clearly indicate Firebase/ESP32 connection status. | Must | Partial |
| FR-UI-10 | The dashboard shall provide settings for thresholds and tariff rates. | Should | Missing |

## 16. Experiment and Evaluation Functional Requirements

| ID | Requirement | Priority | Current Status |
| --- | --- | --- | --- |
| FR-EVAL-01 | The system shall support baseline mode with automation disabled. | Must | Missing |
| FR-EVAL-02 | The system shall support experimental mode with automation enabled. | Must | Missing |
| FR-EVAL-03 | The system shall record total kWh for each test period. | Must | Missing |
| FR-EVAL-04 | The system shall record total LKR cost for each test period. | Must | Missing |
| FR-EVAL-05 | The system shall compare baseline and experimental results. | Must | Missing |
| FR-EVAL-06 | The system shall calculate percentage energy reduction. | Must | Missing |
| FR-EVAL-07 | The system shall identify whether the 20% success indicator was achieved. | Must | Missing |
| FR-EVAL-08 | The system shall export or display an evaluation report. | Should | Missing |

Recommended evaluation formula:

```text
energy_reduction_percent =
  ((baseline_kWh - automated_kWh) / baseline_kWh) * 100
```

Success:

```text
energy_reduction_percent >= 20
```

## 17. Authentication and Security Functional Requirements

| ID | Requirement | Priority | Current Status |
| --- | --- | --- | --- |
| FR-SEC-01 | The system shall require login for dashboard access. | Must | Missing |
| FR-SEC-02 | The system shall support an owner/admin role. | Should | Missing |
| FR-SEC-03 | Firebase credentials shall be loaded from environment variables. | Must | Partial; currently hardcoded in code |
| FR-SEC-04 | Firebase rules shall restrict unauthorized reads and writes. | Must | Missing |
| FR-SEC-05 | Guest privacy shall be protected by avoiding camera/audio data. | Must | Aligned by design |
| FR-SEC-06 | Sensor data shall be stored without personal guest identity. | Must | Needs data policy |

## 18. Hardware and Firmware Functional Requirements

The frontend repository does not currently contain ESP32 firmware. For proposal alignment, a firmware component is required.

| ID | Requirement | Priority | Current Status |
| --- | --- | --- | --- |
| FR-HW-01 | ESP32 shall connect to WiFi. | Must | Missing from repo |
| FR-HW-02 | ESP32 shall write sensor readings to Firebase. | Must | Missing from repo |
| FR-HW-03 | ESP32 shall read device command states from Firebase. | Must | Missing from repo |
| FR-HW-04 | ESP32 shall read PIR sensor input. | Must | Missing from repo |
| FR-HW-05 | ESP32 shall read magnetic door sensor input. | Must | Missing from repo |
| FR-HW-06 | ESP32 shall read PZEM-004T energy values. | Must | Missing from repo |
| FR-HW-07 | ESP32 shall read gas sensor value. | Must | Missing from repo |
| FR-HW-08 | ESP32 shall control relay outputs. | Must | Missing from repo |
| FR-HW-09 | ESP32 shall control buzzer output for gas danger. | Must | Missing from repo |
| FR-HW-10 | ESP32 shall perform gas emergency logic locally. | Must | Missing from repo |

## 19. Recommended Revised Firebase Data Model

For the final project, move from flat single-device structure to a property/room structure.

Recommended structure:

```json
{
  "properties": {
    "property_001": {
      "name": "Demo Tourist Villa",
      "rooms": {
        "room_001": {
          "name": "Room 101",
          "latest": {
            "voltage": 230,
            "current": 1.5,
            "power": 350,
            "energy": 2.8,
            "gas": 300,
            "pir": false,
            "doorOpen": false,
            "ultrasonicPresence": false,
            "occupancyState": "VACANT",
            "occupancyConfidence": 0.8,
            "relayStatus": false,
            "buzzerStatus": false,
            "updatedAt": 1710000000
          },
          "devices": {
            "light": {
              "command": false,
              "actual": false,
              "category": "non-essential"
            },
            "fan": {
              "command": false,
              "actual": false,
              "category": "non-essential"
            },
            "ac": {
              "command": false,
              "actual": false,
              "category": "non-essential"
            },
            "geyser": {
              "command": false,
              "actual": false,
              "category": "non-essential"
            },
            "exhaustFan": {
              "command": false,
              "actual": false,
              "category": "safety"
            },
            "buzzer": {
              "command": false,
              "actual": false,
              "category": "safety"
            }
          },
          "settings": {
            "vacancyTimeoutSeconds": 300,
            "gasWarningThreshold": 400,
            "gasDangerThreshold": 500
          }
        }
      },
      "tariffs": {
        "currency": "LKR",
        "offPeakRate": 0,
        "dayRate": 0,
        "peakRate": 0,
        "peakStart": "18:30",
        "peakEnd": "22:30"
      },
      "alerts": {},
      "history": {},
      "experiments": {}
    }
  }
}
```

## 20. Minimum Viable Prototype Scope

To satisfy the proposal at minimum, implement these features first:

1. ESP32 sends real PIR, door, gas, and PZEM data to Firebase.
2. React dashboard displays real sensor values.
3. Occupancy state is calculated from PIR and door sensor.
4. Relay turns off selected appliance after vacancy timeout.
5. Manual override works from dashboard.
6. Energy kWh is stored over time.
7. Cost is calculated using tariff rate.
8. Gas danger activates buzzer and relay locally on ESP32.
9. Alerts appear on dashboard.
10. Baseline vs automated comparison report is generated.

## 21. Prioritized Development Roadmap

### Phase 1: Stabilize Current Firebase Integration

- Move hardcoded Firebase config from `src/services/firebase.ts` to `.env`.
- Rename `useMQTTSimulation.ts` to a clearer name such as `useFirebaseRealtime.ts`.
- Confirm Firebase nodes work:

```text
sensors
devices
alerts
led
```

- Verify dashboard updates live from Firebase.

### Phase 2: ESP32 Real Sensor Upload

- Add ESP32 firmware folder.
- Connect ESP32 to Firebase.
- Upload:

```text
gas
pir
doorOpen
voltage
current
power
energy
relayStatus
buzzerStatus
updatedAt
```

- Test with Firebase Console and dashboard.

### Phase 3: Occupancy Algorithm

- Add door sensor field.
- Add room state calculation.
- Add vacancy timer.
- Add sleeping/idle protection logic.
- Display room status on dashboard.

### Phase 4: Appliance Automation

- Add automatic control rules.
- Add manual override.
- Add command vs actual state feedback.
- Add action logs.

### Phase 5: Cost and Tariff Module

- Add tariff settings.
- Add kWh history.
- Calculate live cost.
- Calculate cost savings.
- Show savings in dashboard and analytics.

### Phase 6: Evaluation Module

- Add baseline experiment mode.
- Add automated experiment mode.
- Compare kWh and LKR.
- Calculate percentage reduction.
- Show whether 20% target was achieved.

### Phase 7: Security and Final Polish

- Add Firebase Authentication.
- Add safer Firebase database rules.
- Add final documentation.
- Add testing evidence.
- Fix text encoding issues in UI.

## 22. Acceptance Criteria

The project can be considered aligned with the proposal when the following are true:

| Criteria ID | Acceptance Criteria |
| --- | --- |
| AC-01 | ESP32 sends live sensor readings to Firebase. |
| AC-02 | Dashboard displays real-time readings without manual refresh. |
| AC-03 | PIR and door sensor are used together to determine occupancy. |
| AC-04 | System does not immediately turn off appliances when no PIR motion is detected. |
| AC-05 | Appliance relay can be controlled manually from dashboard. |
| AC-06 | Appliance relay can be controlled automatically based on vacancy. |
| AC-07 | Energy usage in kWh is recorded. |
| AC-08 | Cost saving in LKR is calculated using tariff data. |
| AC-09 | Gas danger triggers buzzer and safety relay locally on ESP32. |
| AC-10 | Alerts are displayed in dashboard. |
| AC-11 | Baseline and automated test results can be compared. |
| AC-12 | System demonstrates at least 20% reduction in unoccupied runtime or energy wastage during test conditions. |

## 23. Key Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Firebase data model too flat | Hard to support rooms and experiments | Move to property/room structure before final build |
| PIR-only detection causes false negatives | Guest comfort issue | Add door sensor and idle/sleeping state logic |
| No real kWh history | Cannot prove savings | Store periodic PZEM energy readings |
| Static cost values | Proposal objective not satisfied | Implement tariff algorithm |
| No firmware in repo | Incomplete system evidence | Add ESP32 firmware folder and wiring documentation |
| Open Firebase rules | Security weakness | Add Firebase Auth and scoped rules |
| Relay mains wiring risk | Safety issue | Use optocoupled relay, fuse, enclosure, supervision |

## 24. Conclusion

The current project has a strong dashboard foundation and an initial Firebase Realtime Database integration. It already supports live sensor-style values, device toggles, and alerts.

However, the proposal requires more than a smart home dashboard. The final system must become a tourist accommodation energy management system with:

- Hybrid occupancy detection.
- Room-based appliance automation.
- Real energy monitoring.
- CEB tariff-based cost saving.
- Baseline vs automated evaluation.
- Secure owner dashboard.
- ESP32 firmware and hardware integration.

The highest priority gaps are:

1. Real ESP32 firmware integration.
2. Door sensor and occupancy state algorithm.
3. Automatic relay control based on vacancy.
4. Energy kWh history.
5. CEB tariff cost-saving algorithm.
6. Experiment comparison module.
7. Firebase security and authentication.

Completing these items will align the implementation with the research proposal and provide strong evidence for final year project evaluation.

