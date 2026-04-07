# Software Requirements Specification (SRS)
## Project: Green Home Hub
## Version: 1.0
## Date: 2026-04-07

## 1. Introduction

### 1.1 Purpose
This document defines the software requirements for Green Home Hub, a smart home monitoring and control dashboard. It captures functional and non-functional requirements based on the current implementation and intended backend integration.

### 1.2 Scope
Green Home Hub is a web-based IoT dashboard for household resource monitoring and safety management. The system provides:
- Real-time (simulated) sensor monitoring for voltage, current, power, gas, water level, flow rate, and motion.
- Device control for lights, water pump, exhaust fan, and motion detection.
- Alert generation and alert management.
- Analytics and trend visualizations.
- Configuration and service/API visibility pages.

The current repository primarily contains the frontend application (React + TypeScript). Backend APIs are expected at a configurable base URL.

### 1.3 Definitions and Abbreviations
- SRS: Software Requirements Specification
- IoT: Internet of Things
- MQTT: Message Queuing Telemetry Transport
- API: Application Programming Interface
- UI: User Interface
- PIR: Passive Infrared (motion sensor)
- PPM: Parts Per Million
- ESP32: Microcontroller platform used as IoT edge device

### 1.4 References
- React, TypeScript, Vite, Tailwind CSS, shadcn/ui stack
- Axios-based API service layer
- Recharts for analytics visualization

## 2. Overall Description

### 2.1 Product Perspective
Green Home Hub is a modular frontend dashboard with route-based pages:
- Dashboard
- Energy
- Water
- Gas and Safety
- Device Control
- Alerts
- Analytics
- API Services
- Settings

The current data source is a local MQTT simulation hook for live behavior. Separate API service modules define integration points for real backend data.

### 2.2 Product Functions (High Level)
- Display live sensor values and status indicators.
- Simulate connectivity states (connecting, connected, disconnected).
- Toggle device states and reflect control actions in UI.
- Generate threshold-based alerts.
- Present historical and comparative analytics charts.
- Expose API endpoint catalog and server health check.
- Provide user settings for theme, notifications, connection info, and security toggles.

### 2.3 User Classes and Characteristics
- Home User: Monitors home resource usage and controls devices.
- Technician/Installer: Verifies connectivity, API endpoints, and sensor behavior.
- Admin/Operator: Reviews alerts, analytics, and configuration values.

### 2.4 Operating Environment
- Client: Modern browser (Chrome, Edge, Firefox, Safari latest versions)
- Frontend runtime: Node.js 18+ for development/build
- Deployment: Static hosting (for frontend), optional backend service endpoint
- Network: LAN/Internet access for backend APIs and IoT broker (future/real mode)

### 2.5 Design and Implementation Constraints
- Frontend framework and tooling are fixed to React + TypeScript + Vite.
- UI component system relies on shadcn/ui and Tailwind utility classes.
- Real-time data is currently simulated at client side; not true MQTT transport.
- Backend contract is implied through REST endpoints and may require alignment with actual server implementation.

### 2.6 Assumptions and Dependencies
- A backend service is expected at VITE_API_URL (default http://localhost:5000/api).
- Device and sensor endpoints follow REST conventions.
- IoT hardware integration (ESP32, real MQTT broker) is assumed for production mode but not fully implemented in this repository.

## 3. External Interface Requirements

### 3.1 User Interface Requirements
- Responsive layouts for mobile, tablet, and desktop.
- Sidebar navigation with active route highlighting.
- Status badges for connectivity, alerts, and critical states.
- Visual cards/charts for sensor values and trends.
- Controls include switches, sliders, and action buttons.

### 3.2 Hardware Interfaces
- Intended hardware (future/production):
- ESP32 edge device(s)
- Gas sensor, PIR motion sensor, water level sensor, electrical metering inputs
- Actuators for lights, pump, fan, and related relays

### 3.3 Software Interfaces
- REST APIs:
- Sensors: list, latest, analytics, get by id, create
- Devices: list, get by id, create, update, delete, toggle
- Axios client with JSON content type and request timeout.
- Optional bearer token from local storage for Authorization header.

### 3.4 Communication Interfaces
- HTTP/HTTPS for REST APIs.
- MQTT semantics are simulated in frontend logic (publish/subscribe behavior is mocked).

## 4. Functional Requirements

### 4.1 Dashboard and Live Monitoring
- FR-001: System shall display current sensor values for voltage, current, power, gas, water level, flow rate, and PIR state.
- FR-002: System shall display live connection state as connecting, connected, or disconnected.
- FR-003: System shall update simulated sensor values approximately every 2 seconds when connected.
- FR-004: System shall show last update time for live feed.

### 4.2 Device Control
- FR-005: System shall allow toggling of lights, water pump, exhaust fan, and motion detection.
- FR-006: System shall reflect device ON/OFF state immediately in UI.
- FR-007: System shall provide detailed control cards with per-device control actions.
- FR-008: System shall support local adjustment sliders (e.g., brightness, fan speed) when relevant devices are active.

### 4.3 Alerts
- FR-009: System shall generate alerts based on sensor thresholds.
- FR-010: System shall support alert severity levels: danger, warning, info, success.
- FR-011: System shall allow users to acknowledge and remove alerts.
- FR-012: System shall allow filtering alerts by severity.
- FR-013: System shall provide clear-all action for alert list.

### 4.4 Domain Pages
- FR-014: Energy page shall display consumption stats, live readings, and efficiency indicators.
- FR-015: Water page shall display tank level, flow information, and pump control.
- FR-016: Gas and Safety page shall display gas risk level and emergency emphasis for dangerous conditions.
- FR-017: Gas and Safety page shall show motion logs and PIR detection state.

### 4.5 Analytics
- FR-018: System shall render weekly, monthly, and distribution visualizations.
- FR-019: System shall display summary insights (savings, efficiency, cost reduction, CO2 reduction).
- FR-020: System shall show live mechanical meter components for key sensor streams.

### 4.6 Settings
- FR-021: System shall allow user to toggle dark/light appearance mode.
- FR-022: System shall provide configurable notification preferences.
- FR-023: System shall provide editable connection fields for broker and API endpoint values.
- FR-024: System shall provide security and data management actions in settings UI.

### 4.7 API Services Visibility
- FR-025: System shall show backend API server status (online/offline/checking).
- FR-026: System shall present a categorized catalog of available API endpoints.
- FR-027: System shall support manual refresh of API status.

### 4.8 API Data Access Layer
- FR-028: System shall provide service functions to fetch/create/update/delete/toggle device records.
- FR-029: System shall provide service functions to fetch sensor data, latest readings, and analytics.
- FR-030: System shall support polling of latest sensor data in API mode.

## 5. Non-Functional Requirements

### 5.1 Performance
- NFR-001: Initial page load should be optimized for typical broadband and modern devices.
- NFR-002: UI interactions (toggle/filter/navigation) should provide near-immediate feedback (<200 ms perceived).
- NFR-003: Live update cadence in simulation mode should be 2 seconds.

### 5.2 Reliability and Availability
- NFR-004: UI shall handle API failures gracefully without crashing.
- NFR-005: Error states from API requests shall be captured and exposed via hook-level error fields.

### 5.3 Security
- NFR-006: API client shall support bearer token attachment when token exists.
- NFR-007: Sensitive operations should be protected by backend authentication/authorization in production.
- NFR-008: Transport should use HTTPS in production environments.

### 5.4 Usability and Accessibility
- NFR-009: UI should remain usable across desktop and mobile breakpoints.
- NFR-010: Visual state changes (alerts, status badges, toggles) should be clearly distinguishable.
- NFR-011: Basic keyboard accessibility should be supported via standard UI components.

### 5.5 Maintainability
- NFR-012: Codebase should remain modular with separate pages, components, hooks, and services.
- NFR-013: API contract changes should be isolated to service layer and hooks where possible.

### 5.6 Portability
- NFR-014: Frontend should build and run on Windows/macOS/Linux with Node.js 18+.
- NFR-015: Frontend should be deployable as static assets via standard hosting or CDN.

## 6. Data Requirements

### 6.1 Sensor Data Model
Required attributes:
- deviceId
- deviceType
- value
- unit

Optional attributes:
- location
- status
- timestamp

### 6.2 Device Data Model
Required attributes:
- deviceId
- name
- type
- location

Optional attributes:
- status
- isActive
- settings
- lastActivity

### 6.3 Local Runtime State
- Connection state and last update timestamp.
- Simulated sensor values.
- Device switch states.
- Page-level local states for filters, form toggles, and display controls.

## 7. Business Rules and Threshold Logic

- BR-001: Gas warning threshold triggers at approximately > 400 to 420 ppm (page-specific usage).
- BR-002: Gas danger threshold triggers at > 500 ppm in safety page.
- BR-003: Low water warning triggers below approximately 25 to 30 percent depending on context.
- BR-004: Water full condition is recognized above 95 percent.
- BR-005: Motion alerts are generated when PIR state is true and motion detection is enabled.

## 8. Acceptance Criteria (Release Baseline)

- AC-001: User can navigate all defined routes without runtime failure.
- AC-002: Sensor widgets update in simulation mode after connection is established.
- AC-003: Device toggles update state and reflect visually across control surfaces.
- AC-004: Alerts can be filtered, acknowledged, and deleted.
- AC-005: Analytics charts render with provided datasets.
- AC-006: API services page can detect online/offline status for configured base URL.
- AC-007: App builds successfully with production build command.

## 9. Known Gaps and Future Requirements

- FUT-001: Replace MQTT simulation with real MQTT/WebSocket integration.
- FUT-002: Implement persistent backend-driven alerts and logs.
- FUT-003: Add authentication, role-based access, and secure session handling.
- FUT-004: Implement actionable emergency controls with backend command execution.
- FUT-005: Add automated tests (unit, integration, E2E) with defined quality gates.
- FUT-006: Add audit trail for configuration and device control actions.

## 10. Approval
Prepared from current repository implementation state as of 2026-04-07.
