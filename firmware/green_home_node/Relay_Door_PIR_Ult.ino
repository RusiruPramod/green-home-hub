#define DOOR_SWITCH_PIN 33
#define PIR_PIN 27
#define BUZZER_PIN 25

#define ULTRASONIC_TRIG_PIN 18
#define ULTRASONIC_ECHO_PIN 19

#define RELAY_2_PIN 14   // NEW RELAY

bool doorAlertDone = false;

// last state tracking
int lastDoorState = -1;
int lastPIRState = -1;
bool lastHumanDetected = false;

// relay timing control
unsigned long lastHumanTime = 0;
bool relayState = false;

void beep(int delayTime) {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(delayTime);
  digitalWrite(BUZZER_PIN, LOW);
}

float getDistance() {
  digitalWrite(ULTRASONIC_TRIG_PIN, LOW);
  delayMicroseconds(2);

  digitalWrite(ULTRASONIC_TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(ULTRASONIC_TRIG_PIN, LOW);

  long duration = pulseIn(ULTRASONIC_ECHO_PIN, HIGH, 30000);
  if (duration == 0) return 999;

  return duration * 0.0343 / 2;
}

void setup() {
  Serial.begin(115200);

  pinMode(DOOR_SWITCH_PIN, INPUT);
  pinMode(PIR_PIN, INPUT);

  pinMode(ULTRASONIC_TRIG_PIN, OUTPUT);
  pinMode(ULTRASONIC_ECHO_PIN, INPUT);

  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  pinMode(RELAY_2_PIN, OUTPUT);
  digitalWrite(RELAY_2_PIN, LOW);

  Serial.println("Smart Hotel System READY");
}

void loop() {

  int doorState = digitalRead(DOOR_SWITCH_PIN);
  int pirState = digitalRead(PIR_PIN);
  float distance = getDistance();

  bool humanDetected = (distance <= 50) || (pirState == 1);

  // =========================
  // DOOR LOGIC
  // =========================
  if (doorState != lastDoorState) {

    Serial.print("DOOR STATE: ");
    Serial.println(doorState);

    if (doorState == 0 && doorAlertDone == false) {
      Serial.println("DOOR OPEN ALERT");
      beep(300);
      doorAlertDone = true;
    }

    if (doorState == 1) {
      Serial.println("DOOR CLOSED");
      doorAlertDone = false;
    }

    lastDoorState = doorState;
  }

  // =========================
  // PIR LOGIC
  // =========================
  if (pirState != lastPIRState) {

    if (pirState == 1) {
      Serial.println("MOTION DETECTED");
      beep(120);
    }

    lastPIRState = pirState;
  }

  // =========================
  // ULTRASONIC LOGIC
  // =========================
  if (humanDetected != lastHumanDetected) {

    if (humanDetected) {
      Serial.print("HUMAN DETECTED - DIST: ");
      Serial.println(distance);
      beep(200);
    } else {
      Serial.println(" AREA CLEAR");
    }

    lastHumanDetected = humanDetected;
  }

  // =========================
  // RELAY CONTROL (NEW)
  // =========================

  if (humanDetected) {
    lastHumanTime = millis();

    if (!relayState) {
      relayState = true;
      digitalWrite(RELAY_2_PIN, HIGH);

      Serial.println(" RELAY ON ");
    }
  }

  // turn off after 5 seconds no detection
  if (relayState && (millis() - lastHumanTime > 5000)) {
    relayState = false;
    digitalWrite(RELAY_2_PIN, LOW);

    Serial.println("RELAY OFF");
  }

  delay(200);
}