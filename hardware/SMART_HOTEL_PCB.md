# IoT Smart Hotel Management System — PCB Design Package

**Board:** ESP32 sensor/control carrier
**MCU:** ESP32 DevKit V1 (30-pin)
**PCB:** 2-layer, 100 mm × 100 mm, GND pour on bottom, 4 mounting holes
**Companion firmware:** [`firmware/Final_code/complete.ino`](../firmware/Final_code/complete.ino)

> The importable schematic scaffold is [`easyeda_smart_hotel_schematic.json`](./easyeda_smart_hotel_schematic.json).
> A JSON file cannot be "routed/DRC-clean" on its own — routing, copper pour and DRC are produced
> **inside EasyEDA** after import. Follow [§6](#6-easyeda-workflow-import--layout--route--drc).

---

## 0. How to open the file (this fixes the "format incorrect" error)

The error *"The imported file format incorrect or doesn't match current type"* happens when a
**native EasyEDA `.json`** is loaded through the **Import** menu. Import is only for foreign formats
(Altium / Eagle / KiCad / LTspice). Native files open a different way:

**EasyEDA Standard (easyeda.com/editor):**
1. **File → Open → EasyEDA** → choose `easyeda_smart_hotel_schematic.json`
   *(or simply drag the `.json` onto the canvas).*
2. It opens as a labeled **placement sheet**: U1 in the center with a full pin→net map, and every
   connector J1–J14 placed and labeled around it.

> ⚠️ This sheet is a **placement + net-map aid**, not a pre-wired netlist. A hand-authored JSON that
> pre-connects a 30-pin MCU + 14 connectors with zero floating pins is not reliably importable —
> one malformed pin/net string makes the whole file fail (the very error you hit). The reliable way
> to get a *connected* schematic in Standard is §6: drop real library symbols and connect them with
> **net labels** using the names already printed on the sheet (and listed in §3 / §4 below).

---

## 1. Engineering decisions & corrections ⚠️

These are deviations from the raw spec, made for electrical safety/reliability. **Read before building.**

| # | Item | Why | What I did |
|---|------|-----|-----------|
| 1 | **HC-SR04 ECHO → GPIO19** | ECHO outputs **5 V**; ESP32 GPIO is **3.3 V max**. Direct connection stresses/damages the pin. | Added divider **R7 1 kΩ (series) + R8 2 kΩ (to GND)** → ~3.3 V at GPIO19. |
| 2 | **PZEM-004T TX → GPIO17** | PZEM TTL is **5 V**; ESP32 RX is 3.3 V. | Added divider **R9 1 kΩ + R10 2 kΩ** on PZEM_TX → GPIO17. (ESP32 TX→PZEM RX at 3.3 V is accepted by PZEM, no shift needed.) |
| 3 | **Power input** | Reverse-polarity protection required. | Series **Schottky D1 (SS34)** on +5 V input + bulk **C1 100 µF**. (Series diode drops ~0.4 V; if you need full 5 V, swap for a P-MOSFET ideal-diode — noted in BOM.) |
| 4 | **Decoupling** | ESP32 brownouts on WiFi current spikes. | **C2 100 nF** (3V3–GND) + **C3 100 nF** (5V–GND) next to the module, plus C1 bulk. |
| 5 | **Door switch** | Mechanical switch needs a defined level. | **R6 10 kΩ pull-up to 3V3** on GPIO33; switch shorts to GND when actuated. |
| 6 | **External buzzer** | GPIO25 can't reliably drive a buzzer coil/load. | NPN driver **Q1 (S8050/2N2222) + R5 1 kΩ** base; buzzer between +5 V and Q1 collector. |
| 7 | **Relay outputs** | Spec lists relays as modules (IN/VCC/GND) *and* asks for output screw terminals. | 3-pin **driver headers J9/J10** for relay modules **plus** 3-pos **screw terminals J11/J12 (COM/NO/NC)** as load break-outs for an onboard-relay variant. Populate one or the other. |
| 8 | **Internal LED (GPIO2)** | On-module LED already exists on the DevKit. | No external part — GPIO2 broken out to a test pad only. |

**Sensor supply note:** all sensors are powered from **+5 V** per spec. Their logic outputs (PIR, gas AO, flow, water) are ≤3.3 V on common modules; if your specific PIR/flow module swings to 5 V, add a divider like R7/R8 on that line too.

---

## 2. Bill of Materials (BOM)

| Ref | Part | Value / Type | Pkg | Qty |
|-----|------|--------------|-----|-----|
| U1 | ESP32 DevKit V1 | 30-pin module | 2×15 2.54 hdr | 1 |
| J1 | Power input | Screw terminal 2P | 5.08 mm | 1 |
| J2 | DHT11 header | 1×3 | 2.54 mm | 1 |
| J3 | Flow sensor header | 1×3 | 2.54 mm | 1 |
| J4 | Water-level header | 1×3 | 2.54 mm | 1 |
| J5 | Gas (MQ) header | 1×3 | 2.54 mm | 1 |
| J6 | Door switch | 1×2 | 2.54 mm | 1 |
| J7 | PIR header | 1×3 | 2.54 mm | 1 |
| J8 | HC-SR04 header | 1×4 | 2.54 mm | 1 |
| J9 | Relay 1 driver | 1×3 | 2.54 mm | 1 |
| J10 | Relay 2 driver | 1×3 | 2.54 mm | 1 |
| J11 | Relay 1 output | Screw terminal 3P (COM/NO/NC) | 5.08 mm | 1 |
| J12 | Relay 2 output | Screw terminal 3P (COM/NO/NC) | 5.08 mm | 1 |
| J13 | Buzzer header | 1×2 | 2.54 mm | 1 |
| J14 | PZEM-004T | 1×4 | 2.54 mm | 1 |
| D1 | Schottky diode (rev-pol) | SS34 (or P-MOSFET ideal diode) | SMA | 1 |
| C1 | Bulk cap | 100 µF / 16 V | electrolytic D6.3 | 1 |
| C2,C3 | Decoupling | 100 nF | 0805 | 2 |
| R1 | Ext-LED resistor | 220 Ω | 0805 | 1 |
| R5 | Buzzer base R | 1 kΩ | 0805 | 1 |
| R6 | Door pull-up | 10 kΩ | 0805 | 1 |
| R7,R9 | Divider series | 1 kΩ | 0805 | 2 |
| R8,R10 | Divider to GND | 2 kΩ | 0805 | 2 |
| Q1 | Buzzer driver NPN | S8050 / 2N2222 | SOT-23 | 1 |
| LED1 | External status LED | 3 mm | THT/0805 | 1 |
| H1–H4 | Mounting holes | M3 (3.2 mm) | — | 4 |

---

## 3. Net list (authoritative wiring)

**Power**
```
+5V   : D1.K, U1.VIN, C1.+, C3.1, J2.1, J3.1, J4.1, J5.1, J7.1, J8.1, J9.2, J10.2, J13.1, J14.1
+3V3  : U1.3V3, C2.1, R6.top, R7? (no), 
GND   : J1.2, D1 path n/a, C1.-, C2.2, C3.2, U1.GND, R8.bot, R10.bot, Q1.E,
        J2.3, J3.3, J4.3, J5.3, J6.2, J7.3, J8.4, J9.3, J10.3, J13.2(via Q1), J14.2, H1..H4
VIN_RAW: J1.1 → D1.A      (reverse-polarity series Schottky; D1.K = +5V)
```

**ESP32 GPIO ↔ peripheral**
```
GPIO4   → J2.2     DHT11 DATA
GPIO35  → J3.2     Flow signal      (input-only pin — OK, no output use)
GPIO34  → J4.2     Water-level signal (input-only)
GPIO32  → J5.2     Gas AO
GPIO33  → J6.1     Door switch (+ R6 10k pull-up to 3V3)
GPIO27  → J7.2     PIR OUT
GPIO18  → J8.2     HC-SR04 TRIG
GPIO19  → ECHO_DIV node:  J8.3 → R7(1k) → GPIO19 ; GPIO19 → R8(2k) → GND
GPIO26  → J9.1     Relay 1 IN
GPIO14  → J10.1    Relay 2 IN
GPIO25  → R5(1k) → Q1.B ; Q1.C → J13.2 (buzzer-) ; J13.1 → +5V ; Q1.E → GND
GPIO23  → R1(220) → LED1.A ; LED1.K → GND
GPIO2   → TP1      (internal LED on module; test pad only)
GPIO16  → J14.3    PZEM RX (ESP32 TX2 → PZEM, 3.3V OK, direct)
GPIO17  ← PZEM_DIV node: J14.4 → R9(1k) → GPIO17 ; GPIO17 → R10(2k) → GND
```

**Relay output break-outs (onboard-relay variant only)**
```
J11: COM / NO / NC  (Relay 1 contacts)
J12: COM / NO / NC  (Relay 2 contacts)
```

---

## 4. Connector silk labels (for the PCB silkscreen)

```
J1  5V-IN (+ / -)        J8  HC-SR04 (5V/TRIG/ECHO/GND)
J2  DHT11 (5V/D/GND)     J9  RELAY1 (IN/5V/GND)
J3  FLOW  (5V/S/GND)     J10 RELAY2 (IN/5V/GND)
J4  WATER (5V/S/GND)     J11 RLY1-OUT (COM/NO/NC)
J5  GAS   (5V/AO/GND)    J12 RLY2-OUT (COM/NO/NC)
J6  DOOR  (SIG/GND)      J13 BUZZER (5V/-)
J7  PIR   (5V/OUT/GND)   J14 PZEM (5V/GND/RX/TX)
```

---

## 5. PCB layout plan (100 × 100 mm, 2-layer)

- **Mounting holes H1–H4:** M3 at (5,5), (95,5), (5,95), (95,95) mm; 6 mm keep-out.
- **Power entry (left edge):** J1 → D1 → C1, then +5 V rail across the top.
- **MCU (center):** U1 vertical; place C2/C3 within 5 mm of the 3V3/5V/GND pins.
- **Sensors (right + bottom edges):** group J2–J8 so their cables exit the board edge.
- **Relays (top-right):** J9/J10 drivers near J11/J12 screw terminals; keep mains traces away from logic.
- **Trace widths:** signals **0.3 mm (12 mil)**; +5 V/GND power **0.6–1.0 mm**; relay-output/mains copper **≥1.5 mm** with clearance ≥1.5 mm (creepage for mains).
- **Bottom layer:** solid **GND copper pour**; stitch with vias around the board.
- **Clearance:** default 0.254 mm logic; **≥1.5 mm around J11/J12 mains**.

---

## 6. EasyEDA Standard workflow: build → route → DRC (the reliable path)

This is the method that always works in Standard — symbols come from EasyEDA's own libraries, so
nothing can "fail to import," and connectivity is done with **net labels** (no manual wire routing
needed: any two pins carrying the same net-label name are electrically connected).

1. **New schematic:** *File → New → Schematic*. (Optionally open
   [`easyeda_smart_hotel_schematic.json`](./easyeda_smart_hotel_schematic.json) via *File → Open →
   EasyEDA* in a second tab as your placement/net-map reference.)
2. **Place library parts** — press **Shift+F** (Library) and search:

   | Part | Library search term |
   |------|--------------------|
   | ESP32 DevKit V1 | `ESP32 DEVKIT V1` or `ESP32-DEVKITC-32` |
   | 1×3 / 1×4 / 1×2 headers | `HDR-1X3`, `HDR-1X4`, `HDR-1X2` (2.54 mm) |
   | Power screw terminal 2P | `KF301-2P` / `screw terminal 5.08 2P` |
   | Relay-out screw terminal 3P | `KF301-3P` |
   | Schottky D1 | `SS34` |
   | NPN Q1 | `S8050` or `2N2222` |
   | Resistors/caps | `R0805`, `C0805`, `CAP 100uF` |
   | HC-SR04 (optional symbol) | `HC-SR04` |

3. **Connect with net labels** (toolbar **N**, or `Place → Net Label`): drop a label on each pin and
   type the net name from **§3 / §4**. Identical names auto-connect. Use the dedicated power flags for
   **+5V**, **+3V3**, **GND** (`Place → Net Flag`). No pin should be left without a label.
4. **Verify connectivity:** open **Design Manager** (left panel) → expand **Nets**; confirm `+5V`,
   `GND`, `+3V3` and every `NET_*` lists all the pins from §3. Anything in "unconnected" = a missing label.
5. **Assign footprints** to every part (Design Manager flags missing ones).
6. **Convert to PCB:** *Design → Convert Schematic to PCB*.
7. **Board outline:** set to **100 × 100 mm**; add 4× M3 mounting holes per §5.
8. **Place** components per §5; **route** (manual, or *Route → Auto Router*).
9. **Copper pour** GND on the bottom layer: *Place → Copper Area → GND*; add stitching vias.
10. **DRC:** *Design → Design Rule Check*; set clearance/width rules from §5 and fix until clean.
11. **Output:** *Fabrication → Gerber* / BOM / pick-and-place.

> Tip: building it this way takes ~10–15 min and is far more robust than chasing a perfect raw JSON,
> because EasyEDA validates each library symbol and each net for you as you go.

---

## 7. GPIO ↔ firmware cross-check

Matches `complete.ino` exactly (flow 35, water 34, gas 32, door 33, PIR 27, ultra 18/19,
DHT 4, relay-fan 26, relay-presence 14, buzzer 25, ext-LED 23, int-LED 2). `complete.ino`
also defines GPIO16/17 for PZEM wiring, but the current implementation still publishes dummy PZEM
telemetry instead of reading `Serial2`.
