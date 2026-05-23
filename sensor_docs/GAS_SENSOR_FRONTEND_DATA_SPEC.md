# Gas Sensor Frontend Data Spec

Project: Green Home Hub
Last updated: 2026-05-23
Purpose: Define the expected gas sensor data for frontend display and alert behavior.

---

## 1) Firebase Source Path

Primary realtime path:

`properties/property_001/rooms/room_001/latest/gas`

Room-level pages may also consume:

`properties/property_001/rooms/<room_id>/latest/gas`

---

## 2) Expected Data Contract

Field: `gas`
Type: `number`
Unit: `ppm`
Meaning: Instantaneous gas concentration for room safety display.

Recommended payload shape at `latest` node:

```json
{
  "gas": 275,
  "updatedAt": 1747987200000
}
```

Required related field:
- `updatedAt` (number, Unix ms) for live/offline freshness checks.

---

## 3) Validation Rules (Frontend)

The frontend should treat `gas` as valid when:
- It is a finite number.
- It is not negative.

Fallback behavior:
- If missing, null, NaN, or invalid -> display `0 ppm` and mark as stale if `updatedAt` is old/missing.

Suggested safe normalization:

```ts
const gasPpm = Number.isFinite(rawGas) && rawGas >= 0 ? rawGas : 0;
```

---

## 4) Display Rules Used in Current UI

Current UI expectations in this codebase:
- Unit shown as `ppm`.
- Warning threshold: `gas > 400`.
- Normal state: `gas <= 400`.

Applied in:
- Dashboard gas card status
- Rooms room-card gas warning style
- Room summary warning count

---

## 5) Severity Mapping (Recommended)

Use this mapping for consistent frontend coloring and alerts:

- `0-250 ppm` -> `normal`
- `251-400 ppm` -> `elevated`
- `>400 ppm` -> `warning` (already used in UI)
- `>700 ppm` -> `critical` (recommended for future alert escalation)

Note: Keep `>400 ppm` as the minimum warning trigger to stay compatible with existing pages.

---

## 6) Frontend Display Payload Example

Example value consumed by a sensor card:

```json
{
  "title": "Gas Level",
  "value": 325,
  "unit": "ppm",
  "status": "online",
  "warning": false,
  "lastUpdated": 1747987200000
}
```

Warning example:

```json
{
  "title": "Gas Level",
  "value": 455,
  "unit": "ppm",
  "status": "warning",
  "warning": true,
  "lastUpdated": 1747987200000
}
```

---

## 7) API/Realtime Expectations for Firmware

Firmware should:
- Update `latest/gas` every sensor cycle.
- Write numeric `gas` values only.
- Include `updatedAt` whenever possible.
- Avoid writing strings like `"450 ppm"` (unit must stay in frontend only).

---

## 8) Quick Checklist

- [ ] Firebase writes `latest/gas` as number
- [ ] Unit in UI is `ppm`
- [ ] Threshold `> 400` triggers warning style
- [ ] Invalid values are normalized to `0`
- [ ] `updatedAt` is present for freshness