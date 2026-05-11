# Functional Requirements Document

## Smart IoT-Based Energy Management System for Tourist Accommodation in Sri Lanka

## 1. Document Control

| Item | Details |
| --- | --- |
| Document Type | Functional Requirements Document |
| Project | Smart IoT-Based Energy Management System for Tourist Accommodation in Sri Lanka |
| Repository | `green-home-hub` |
| Target Users | Tourist accommodation owners, villa managers, guesthouse operators |
| Main Technologies | ESP32, Firebase Realtime Database, React Dashboard |
| Source Reference | `Research_Project_Proposal_group_12.pdf` |

## 2. Purpose

This Functional Requirements Document defines the required behavior of the proposed IoT-based Energy Management System.

The document is written according to the project proposal and is intended to guide:

- Frontend implementation
- Firebase database design
- ESP32 firmware development
- Hardware integration
- Testing and final prototype validation
- Viva and thesis documentation

## 3. Project Overview

The proposed system is a cost-effective IoT Energy Management System for small and medium tourist accommodations in Sri Lanka.

The system uses sensors and automation to reduce unnecessary electricity usage when guest rooms are unoccupied.

The system shall:

- Detect room occupancy in real time.
- Monitor appliance energy consumption.
- Automatically control appliances through relays.
- Allow manual override from a web dashboard.
- Calculate estimated cost savings using CEB tariff rates.
- Alert users about unsafe or abnormal conditions.
- Provide evidence of energy reduction through baseline and automated test comparison.

## 4. Problem Statement

Small and medium tourist accommodations in Sri Lanka face high electricity costs because guests often leave high-consumption appliances running when rooms are vacant.

Examples:

- Air conditioners left on after guests leave.
- Lights and fans running unnecessarily.
- Geysers operating without active use.
- No remote monitoring for owners.
- Manual monitoring is inefficient.
- Key-card systems can be bypassed.

The system must solve this by combining IoT sensing, automated control, real-time monitoring, and cost analysis.

## 5. Project Objectives

| Objective ID | Objective |
| --- | --- |
| OBJ-01 | Detect human presence in a guest room accurately using a sensor node. |
| OBJ-02 | Reduce false vacancy detection when guests are sleeping or inactive. |
| OBJ-03 | Provide a secure web dashboard for live monitoring and manual appliance control. |
| OBJ-04 | Automatically control non-essential appliances based on occupancy. |
| OBJ-05 | Monitor energy usage using an energy meter module. |
| OBJ-06 | Calculate estimated electricity cost and savings using CEB tariff rates. |
| OBJ-07 | Evaluate energy reduction by comparing baseline and automated operation. |
| OBJ-08 | Provide safety alerts for abnormal sensor conditions, including gas detection. |

## 6. System Scope

## 6.1 In Scope

The system shall include:

- ESP32-based sensor node.
- PIR motion sensor integration.
- Magnetic door sensor integration.
- PZEM-004T energy meter integration.
- Gas sensor integration.
- Relay control for appliances.
- Buzzer control for gas alerts.
- Firebase Realtime Database integration.
- React web dashboard.
- Real-time sensor display.
- Appliance manual override.
- Occupancy-based appliance automation.
- CEB tariff-based cost calculation.
- Energy usage history.
- Alert management.
- Baseline vs automated energy comparison.

## 6.2 Out of Scope

The following are not required for the first final prototype:

- Mobile application.
- Payment gateway.
- Camera-based guest monitoring.
- Audio recording.
- Full commercial multi-tenant billing system.
- Advanced AI prediction model.
- Patent-ready hardware PCB.
- Integration with official CEB billing API.

## 7. Stakeholders

| Stakeholder | Role / Interest |
| --- | --- |
| Property Owner | Monitors rooms, controls appliances, checks savings |
| Villa / Guesthouse Manager | Uses dashboard for daily operation |
| Guest / Tourist | Benefits from smart room comfort and safety |
| Project Team | Designs, builds, tests, and documents system |
| Supervisor / Examiner | Evaluates technical and research contribution |
| CEB / Energy Sector | Indirect beneficiary through reduced demand |

## 8. User Roles

## 8.1 Owner / Admin

The owner/admin can:

- Log in to dashboard.
- View room status.
- View sensor readings.
- Manually control appliances.
- View alerts.
- Configure thresholds.
- Configure tariff rates.
- View analytics and savings.
- View experiment results.

## 8.2 System / ESP32 Node

The ESP32 node can:

- Read connected sensors.
- Control relays and buzzer.
- Send latest sensor data to Firebase.
- Send historical readings to Firebase.
- Read device commands from Firebase.
- Apply automation logic locally where safety is required.

## 8.3 Guest

The guest does not directly use the dashboard.

The guest indirectly interacts with:

- Room occupancy sensors.
- Automated appliance behavior.
- Safety alerts.

Guest privacy must be protected.

## 9. Assumptions

- Each room has at least one ESP32 node.
- The ESP32 has WiFi access.
- Firebase Realtime Database is available during normal operation.
- Gas safety actions are handled locally by ESP32 even if WiFi fails.
- Energy readings come from PZEM-004T or equivalent energy metering module.
- The first prototype may support one room, but the design should allow extension to multiple rooms.

## 10. Proposed System Architecture

```text
Sensors and Appliances
  PIR Sensor
  Door Sensor
  Gas Sensor
  PZEM-004T
  Relay Module
  Buzzer
        |
        v
ESP32 Sensor Node
        |
        | WiFi
        v
Firebase Realtime Database
        |
        v
React Web Dashboard
```

## 11. Major System Modules

| Module ID | Module | Description |
| --- | --- | --- |
| MOD-01 | Sensor Acquisition Module | Reads raw sensor values from ESP32 hardware |
| MOD-02 | Occupancy Detection Module | Determines room occupancy state |
| MOD-03 | Appliance Control Module | Controls relays manually or automatically |
| MOD-04 | Energy Monitoring Module | Reads voltage, current, power, and energy |
| MOD-05 | Tariff and Savings Module | Calculates cost and savings |
| MOD-06 | Alert and Safety Module | Handles gas, water, power, and occupancy alerts |
| MOD-07 | Firebase Sync Module | Sends and receives real-time data |
| MOD-08 | Web Dashboard Module | Displays system state and controls |
| MOD-09 | Evaluation Module | Compares baseline and automated energy usage |
| MOD-10 | Authentication Module | Secures dashboard access |

## 12. Functional Requirements

Priority:

- Must: required for final prototype.
- Should: important for stronger project quality.
- Could: optional enhancement.

## 12.1 Sensor Acquisition Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-SEN-001 | The system shall read PIR motion sensor status from the ESP32. | Must |
| FR-SEN-002 | The system shall read magnetic door sensor status from the ESP32. | Must |
| FR-SEN-003 | The system shall read gas sensor value from the ESP32. | Must |
| FR-SEN-004 | The system shall read voltage from the PZEM-004T energy meter. | Must |
| FR-SEN-005 | The system shall read current from the PZEM-004T energy meter. | Must |
| FR-SEN-006 | The system shall read active power in watts from the PZEM-004T energy meter. | Must |
| FR-SEN-007 | The system shall read accumulated energy in kWh from the PZEM-004T energy meter. | Must |
| FR-SEN-008 | The system should read temperature and humidity from DHT11/DHT22 if available. | Should |
| FR-SEN-009 | The system should read light intensity from LDR if available. | Should |
| FR-SEN-010 | The system could read ultrasonic presence status if available. | Could |
| FR-SEN-011 | The ESP32 shall attach a timestamp to each sensor update. | Must |
| FR-SEN-012 | The system shall update latest sensor values in Firebase at a configurable interval. | Must |
| FR-SEN-013 | The system shall store periodic historical sensor readings for analysis. | Must |

## 12.2 Occupancy Detection Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-OCC-001 | The system shall determine occupancy using PIR motion and door sensor data. | Must |
| FR-OCC-002 | The system shall support more than two room states. | Must |
| FR-OCC-003 | The system shall identify `VACANT` state. | Must |
| FR-OCC-004 | The system shall identify `OCCUPIED_ACTIVE` state. | Must |
| FR-OCC-005 | The system shall identify `OCCUPIED_IDLE` state. | Must |
| FR-OCC-006 | The system shall identify possible `OCCUPIED_SLEEPING` state to reduce false negatives. | Must |
| FR-OCC-007 | The system shall apply a vacancy confirmation delay before turning off appliances. | Must |
| FR-OCC-008 | The system shall not turn off appliances immediately when PIR motion stops. | Must |
| FR-OCC-009 | The system shall record occupancy state changes with timestamps. | Should |
| FR-OCC-010 | The system shall display current room occupancy state on the dashboard. | Must |
| FR-OCC-011 | The system should calculate total occupied and vacant duration per room. | Should |

Recommended occupancy states:

```text
VACANT
ENTRY_DETECTED
OCCUPIED_ACTIVE
OCCUPIED_IDLE
OCCUPIED_SLEEPING
EXIT_PENDING
VACANT_CONFIRMED
```

## 12.3 Appliance Control Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-CTL-001 | The system shall allow the owner to manually turn lights on/off from the dashboard. | Must |
| FR-CTL-002 | The system shall allow the owner to manually turn fan or AC on/off from the dashboard. | Must |
| FR-CTL-003 | The system shall allow the owner to manually turn geyser or other controlled appliance on/off. | Should |
| FR-CTL-004 | The system shall write manual control commands to Firebase. | Must |
| FR-CTL-005 | The ESP32 shall read control commands from Firebase. | Must |
| FR-CTL-006 | The ESP32 shall apply received commands to relay outputs. | Must |
| FR-CTL-007 | The system shall display actual appliance feedback state where available. | Should |
| FR-CTL-008 | The system shall automatically turn off non-essential appliances when room vacancy is confirmed. | Must |
| FR-CTL-009 | The system shall allow manual override of automatic appliance control. | Must |
| FR-CTL-010 | The system shall log manual and automatic appliance control events. | Should |
| FR-CTL-011 | The system shall prevent safety appliances from being disabled by normal energy-saving automation. | Must |

Appliance categories:

| Category | Examples | Automation Rule |
| --- | --- | --- |
| Non-essential | Light, fan, AC, geyser | Can be turned off when room is vacant |
| Essential | Router, controller power | Should remain on |
| Safety | Buzzer, exhaust fan, gas relay | Controlled by safety rules |

## 12.4 Energy Monitoring Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-ENE-001 | The dashboard shall display live voltage. | Must |
| FR-ENE-002 | The dashboard shall display live current. | Must |
| FR-ENE-003 | The dashboard shall display live power in watts. | Must |
| FR-ENE-004 | The dashboard shall display accumulated energy in kWh. | Must |
| FR-ENE-005 | The system shall store energy readings periodically. | Must |
| FR-ENE-006 | The system shall display daily energy usage. | Must |
| FR-ENE-007 | The system should display weekly and monthly energy usage. | Should |
| FR-ENE-008 | The system shall calculate energy usage while room is occupied. | Should |
| FR-ENE-009 | The system shall calculate energy usage while room is vacant. | Must |
| FR-ENE-010 | The system shall identify unnecessary appliance runtime during vacancy. | Must |

## 12.5 Tariff and Cost Saving Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-COST-001 | The system shall store CEB tariff rates in configurable settings. | Must |
| FR-COST-002 | The system shall calculate electricity cost from consumed kWh. | Must |
| FR-COST-003 | The system shall support time-of-use tariff periods. | Must |
| FR-COST-004 | The system shall calculate cost during peak tariff hours. | Must |
| FR-COST-005 | The system shall calculate estimated savings from automated shutoff. | Must |
| FR-COST-006 | The dashboard shall display estimated savings in LKR. | Must |
| FR-COST-007 | The system shall allow tariff rates to be updated from settings. | Should |
| FR-COST-008 | The system should display cost comparison between baseline and automated operation. | Should |

Recommended tariff periods:

```text
Day period
Peak period
Off-peak period
```

Recommended formula:

```text
cost = off_peak_kWh * off_peak_rate
     + day_kWh * day_rate
     + peak_kWh * peak_rate
```

Estimated saving:

```text
saving = baseline_cost - automated_cost
```

## 12.6 Alert and Safety Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-ALT-001 | The system shall create an alert when gas level exceeds warning threshold. | Must |
| FR-ALT-002 | The system shall create a critical alert when gas level exceeds danger threshold. | Must |
| FR-ALT-003 | The ESP32 shall immediately turn buzzer on when gas danger threshold is exceeded. | Must |
| FR-ALT-004 | The ESP32 shall immediately activate the configured safety relay when gas danger threshold is exceeded. | Must |
| FR-ALT-005 | The system shall display active alerts on the dashboard in real time. | Must |
| FR-ALT-006 | The system shall allow the owner to acknowledge alerts. | Should |
| FR-ALT-007 | The system shall avoid repeatedly creating duplicate alerts for the same ongoing incident. | Should |
| FR-ALT-008 | The system shall record alert timestamp, source, type, and message. | Must |
| FR-ALT-009 | The system should create a recovery alert when a dangerous condition returns to normal. | Could |
| FR-ALT-010 | The system should alert when water level is below threshold if water monitoring is used. | Could |
| FR-ALT-011 | The system should alert when voltage exceeds safe threshold. | Could |

Gas safety principle:

```text
Gas sensor -> ESP32 local decision -> buzzer/relay action -> Firebase update -> dashboard alert
```

The ESP32 must not wait for the dashboard or Firebase before activating buzzer/relay in a gas danger situation.

## 12.7 Dashboard Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-UI-001 | The dashboard shall display all latest sensor readings in real time. | Must |
| FR-UI-002 | The dashboard shall show Firebase/ESP32 connection status. | Must |
| FR-UI-003 | The dashboard shall show room occupancy status. | Must |
| FR-UI-004 | The dashboard shall show device control cards. | Must |
| FR-UI-005 | The dashboard shall provide manual control switches. | Must |
| FR-UI-006 | The dashboard shall display live energy chart. | Must |
| FR-UI-007 | The dashboard shall display live alerts. | Must |
| FR-UI-008 | The dashboard shall display energy usage summary. | Must |
| FR-UI-009 | The dashboard shall display estimated cost savings. | Must |
| FR-UI-010 | The dashboard should support room selection. | Should |
| FR-UI-011 | The dashboard should support settings for thresholds and tariffs. | Should |
| FR-UI-012 | The dashboard should display baseline vs automated comparison results. | Should |

## 12.8 Authentication and Security Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-SEC-001 | The system shall require owner/admin login to access the dashboard. | Must |
| FR-SEC-002 | The system shall use Firebase Authentication or equivalent authentication mechanism. | Must |
| FR-SEC-003 | The system shall restrict database read/write permissions using Firebase rules. | Must |
| FR-SEC-004 | Firebase configuration shall be loaded from environment variables. | Must |
| FR-SEC-005 | The system shall not use camera or audio recording for occupancy detection. | Must |
| FR-SEC-006 | The system shall avoid storing personally identifiable guest data. | Must |
| FR-SEC-007 | The system should log important control actions for accountability. | Should |

## 12.9 Evaluation Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-EVAL-001 | The system shall support baseline test mode with automation disabled. | Must |
| FR-EVAL-002 | The system shall support automated test mode with occupancy automation enabled. | Must |
| FR-EVAL-003 | The system shall record total energy consumption for each test mode. | Must |
| FR-EVAL-004 | The system shall record estimated cost for each test mode. | Must |
| FR-EVAL-005 | The system shall compare baseline and automated energy usage. | Must |
| FR-EVAL-006 | The system shall calculate energy reduction percentage. | Must |
| FR-EVAL-007 | The system shall identify whether the target reduction of at least 20% was achieved. | Must |
| FR-EVAL-008 | The system should generate a readable evaluation summary for thesis evidence. | Should |

Evaluation formula:

```text
energy_reduction_percentage =
  ((baseline_kWh - automated_kWh) / baseline_kWh) * 100
```

Success condition:

```text
energy_reduction_percentage >= 20
```

## 13. Firebase Functional Data Requirements

## 13.1 Minimum Prototype Data Structure

```json
{
  "sensors": {
    "pir": false,
    "doorOpen": false,
    "gas": 0,
    "voltage": 0,
    "current": 0,
    "power": 0,
    "energy": 0,
    "relayStatus": false,
    "buzzerStatus": false,
    "updatedAt": 0
  },
  "devices": {
    "light": false,
    "fan": false,
    "ac": false,
    "geyser": false,
    "automationEnabled": true,
    "manualOverride": false,
    "updatedAt": 0
  },
  "occupancy": {
    "state": "VACANT",
    "lastMotionAt": 0,
    "lastDoorChangeAt": 0,
    "lastStateChangeAt": 0
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
```

## 13.2 Scalable Property Data Structure

```json
{
  "properties": {
    "property_001": {
      "name": "Demo Tourist Villa",
      "rooms": {
        "room_001": {
          "name": "Room 101",
          "latest": {},
          "devices": {},
          "occupancy": {},
          "settings": {}
        }
      },
      "tariffs": {},
      "alerts": {},
      "history": {},
      "experiments": {}
    }
  }
}
```

## 14. Main Use Cases

## 14.1 Use Case: Monitor Room Status

| Field | Details |
| --- | --- |
| Actor | Owner/Admin |
| Precondition | ESP32 and Firebase are connected |
| Flow | Owner opens dashboard, selects room, views occupancy, sensors, energy, and alerts |
| Output | Current room status is visible |

## 14.2 Use Case: Manual Appliance Control

| Field | Details |
| --- | --- |
| Actor | Owner/Admin |
| Precondition | Dashboard is connected to Firebase |
| Flow | Owner toggles appliance switch, Firebase updates command, ESP32 reads command, relay changes state |
| Output | Appliance state changes |

## 14.3 Use Case: Automatic Shutoff

| Field | Details |
| --- | --- |
| Actor | System |
| Precondition | Automation is enabled |
| Flow | Room becomes vacant, vacancy timeout passes, system turns off non-essential appliances |
| Output | Energy wastage is reduced |

## 14.4 Use Case: Gas Danger Alert

| Field | Details |
| --- | --- |
| Actor | ESP32/System |
| Precondition | Gas sensor is connected |
| Flow | Gas exceeds threshold, ESP32 turns buzzer and relay on, Firebase receives alert, dashboard shows critical warning |
| Output | Safety response occurs immediately |

## 14.5 Use Case: Cost Saving Calculation

| Field | Details |
| --- | --- |
| Actor | System |
| Precondition | Energy history and tariff rates are available |
| Flow | System calculates energy cost and estimated savings based on baseline and automated usage |
| Output | Owner sees LKR savings |

## 14.6 Use Case: Evaluation Report

| Field | Details |
| --- | --- |
| Actor | Project Team / Examiner |
| Precondition | Baseline and automated test data exist |
| Flow | System compares two test periods and calculates energy reduction |
| Output | Evaluation result shows whether 20% reduction target was achieved |

## 15. Traceability Matrix

| Proposal Objective | Related Functional Requirements |
| --- | --- |
| OBJ-01: Detect human presence accurately | FR-SEN-001, FR-SEN-002, FR-OCC-001 to FR-OCC-011 |
| OBJ-02: Secure dashboard and manual override | FR-UI-001 to FR-UI-012, FR-CTL-001 to FR-CTL-011, FR-SEC-001 to FR-SEC-007 |
| OBJ-03: Cost savings using CEB tariff | FR-ENE-001 to FR-ENE-010, FR-COST-001 to FR-COST-008 |
| OBJ-04: Compare before and after energy usage | FR-EVAL-001 to FR-EVAL-008 |
| Added gas safety requirement | FR-SEN-003, FR-ALT-001 to FR-ALT-011 |

## 16. Acceptance Criteria

| ID | Acceptance Criteria |
| --- | --- |
| AC-001 | ESP32 sends live PIR, door, gas, voltage, current, power, and energy data to Firebase. |
| AC-002 | Dashboard updates sensor readings in real time without page refresh. |
| AC-003 | Occupancy state changes based on PIR and door sensor data. |
| AC-004 | The system does not classify a room as vacant only because PIR motion stops. |
| AC-005 | Manual appliance control from dashboard updates Firebase command state. |
| AC-006 | ESP32 applies Firebase device commands to relays. |
| AC-007 | Non-essential appliances are automatically turned off after confirmed vacancy. |
| AC-008 | Energy usage in kWh is stored and displayed. |
| AC-009 | Cost in LKR is calculated using stored tariff rates. |
| AC-010 | Estimated savings are displayed on the dashboard. |
| AC-011 | Gas danger immediately activates buzzer and relay locally on ESP32. |
| AC-012 | Gas danger creates a Firebase alert and dashboard warning. |
| AC-013 | Baseline and automated test results can be compared. |
| AC-014 | System calculates whether at least 20% energy wastage reduction is achieved. |
| AC-015 | Dashboard access is protected by login. |

## 17. Implementation Priority

## 17.1 Must Implement for Final Prototype

1. ESP32 to Firebase live sensor upload.
2. React dashboard live sensor display.
3. PIR + door occupancy detection.
4. Manual relay control.
5. Occupancy-based automatic appliance shutoff.
6. PZEM energy monitoring.
7. CEB tariff cost calculation.
8. Gas buzzer and relay safety logic.
9. Alert display.
10. Baseline vs automated comparison.

## 17.2 Should Implement for Strong Viva

1. Firebase Authentication.
2. Room-based UI.
3. Appliance command vs actual state.
4. Historical charts.
5. Configurable thresholds.
6. Alert acknowledgement.
7. Experiment summary export.

## 17.3 Could Implement if Time Allows

1. Ultrasonic sensor support.
2. DHT temperature/humidity optimization.
3. LDR-based lighting automation.
4. SMS alert with GSM module.
5. Multi-property support.

## 18. Non-Functional Notes

Although this document focuses on functional requirements, the following non-functional qualities are important:

- Safety: high-voltage relay circuits must be isolated and enclosed.
- Privacy: no camera or microphone should be used.
- Reliability: gas safety action must work without internet dependency.
- Usability: dashboard should be simple for non-technical villa owners.
- Performance: dashboard updates should appear within a few seconds.
- Maintainability: Firebase and sensor logic should be separated into clear modules.
- Security: Firebase rules should not remain public for final deployment.

## 19. Final Deliverables

The final project should deliver:

- Working ESP32 hardware prototype.
- Sensor wiring documentation.
- ESP32 firmware.
- Firebase Realtime Database structure.
- React dashboard.
- Functional dashboard controls.
- Energy and cost analytics.
- Alert system.
- Baseline vs automated evaluation results.
- Final thesis documentation.

## 20. Conclusion

This FRD converts the research proposal into clear functional requirements.

The most important implementation focus is not only to display IoT values, but to prove that the system reduces energy wastage in tourist accommodations.

Therefore, the final prototype must prioritize:

- Reliable occupancy detection.
- Automatic appliance control.
- Real energy measurement.
- Cost saving calculation.
- Experimental comparison.

These features directly support the project aim of reducing operational energy costs for Sri Lankan tourist accommodation providers.

