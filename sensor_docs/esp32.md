# ESP32 Pins — Used & Free

**Board:** ESP32 DevKit V1 (30-pin)

## Used Pins
- GPIO2 — Internal LED
- GPIO4 — DHT11 (temp/humidity)
- GPIO16 — PZEM RX (PCB only)
- GPIO17 — PZEM TX (PCB only)
- GPIO18 — Ultrasonic TRIG
- GPIO19 — Ultrasonic ECHO
- GPIO23 — External LED
- GPIO25 — Buzzer
- GPIO27 — PIR motion
- GPIO32 — Gas sensor (analog)
- GPIO33 — Door switch
- GPIO34 — Water level (analog)
- GPIO35 — Flow sensor

## Relay Pins
- GPIO26 — Relay 1 — Exhaust Fan (gas)
  - Auto: turns ON when gas detected, then auto OFF.
  - Manual: user can ON/OFF exhaust fan from app (reusable).
- GPIO14 — Relay 2 — (presence relay)
- GPIO13 — Relay 3 — Lights
- GPIO5  — Relay 4 — Pump
- GPIO21 — Relay 5 — Fan

## Free Pins
- GPIO12 — OK (keep LOW at boot)
- GPIO15 — OK (keep HIGH at boot)
- GPIO22 — OK (I2C SCL)
- GPIO36 — Input only (analog)
- GPIO39 — Input only (analog)

## Don't Use
- GPIO1, GPIO3 — USB serial
- GPIO6–GPIO11 — Flash memory
- GPIO0 — Not on 30-pin board
