//with serial print flooding,  test each sensor separately by commenting out the others in the loop and observing the serial output. This way, you can verify that each sensor is working correctly before integrating them together.
#define DOOR_SWITCH_PIN 33
#define PIR_PIN 27
#define BUZZER_PIN 25

#define ULTRASONIC_TRIG_PIN 18
#define ULTRASONIC_ECHO_PIN 19

bool doorAlertDone = false;   // 🔥 latch control

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

  Serial.println("Smart Hotel Alarm System Started");
}

void loop() {

  int doorState = digitalRead(DOOR_SWITCH_PIN);
  int pirState = digitalRead(PIR_PIN);
  float distance = getDistance();

  Serial.print("Door: ");
  Serial.print(doorState);
  Serial.print(" | PIR: ");
  Serial.print(pirState);
  Serial.print(" | Dist: ");
  Serial.println(distance);

  //  DOOR OPEN LOGIC (ONCE ONLY)
  if (doorState == 0 && doorAlertDone == false) {

    Serial.println("DOOR OPEN ALERT");

    beep(300);        // single alert tone
    delay(200);

    digitalWrite(BUZZER_PIN, LOW);  //  force OFF

    doorAlertDone = true; // lock alarm
  }

  //  RESET when door closes
  if (doorState == 1) {
    doorAlertDone = false;
  }

  //  PIR MOTION (single beep)
  if (pirState == 1) {
    Serial.println("MOTION DETECTED");
    beep(120);
    delay(300);
    digitalWrite(BUZZER_PIN, LOW);
  }

  //  ULTRASONIC ≤ 50cm
  if (distance <= 50) {
    Serial.println("HUMAN DETECTED (ULTRASONIC)");
    beep(200);
    delay(300);
    digitalWrite(BUZZER_PIN, LOW);
  }

  delay(200);
}