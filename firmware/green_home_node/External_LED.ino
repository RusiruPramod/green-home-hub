External LED EFFECT IOT Blink
// ======================
#define EXTERNAL_LED_PIN     23  

void starlinkLED() {
  float wave = (sin(millis() * 0.005) + 1.0) / 2.0;
  int brightness = wave * 255;
  analogWrite(EXTERNAL_LED_PIN, brightness);
}

