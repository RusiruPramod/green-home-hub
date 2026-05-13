import {
  onValue,
  push,
  ref,
  remove,
  serverTimestamp,
  set,
  update,
  type Unsubscribe,
} from "firebase/database";
import { realtimeDb, initError } from "@/services/firebase";

export interface SensorsPayload {
  voltage: number;
  current: number;
  power: number;
  energy: number;
  gas: number;
  pir: boolean;
  doorOpen: boolean;
  temperature: number;
  humidity: number;
  lightLevel: number;
  waterLevel: number;
  flowRate: number;
  totalLiters: number;
  relayStatus: boolean;
  buzzerStatus: boolean;
  occupancyState?: string;
  updatedAt?: number;
}

export interface DevicesPayload {
  lights: boolean;
  waterPump: boolean;
  exhaustFan: boolean;
  motionDetection: boolean;
  mainRelay: boolean;
  buzzer: boolean;
  updatedAt?: number;
}

export type AlertType = "danger" | "warning" | "info" | "success";

export interface AlertPayload {
  type: AlertType;
  title: string;
  message: string;
  source?: string;
}

export interface AlertRecord extends AlertPayload {
  id: string;
  acknowledged: boolean;
  createdAt?: number;
}

const sensorDefaults: SensorsPayload = {
  voltage: 0,
  current: 0,
  power: 0,
  energy: 0,
  gas: 0,
  pir: false,
  doorOpen: false,
  temperature: 0,
  humidity: 0,
  lightLevel: 0,
  waterLevel: 0,
  flowRate: 0,
  totalLiters: 0,
  relayStatus: false,
  buzzerStatus: false,
  occupancyState: "VACANT",
};

const deviceDefaults: DevicesPayload = {
  lights: false,
  waterPump: false,
  exhaustFan: false,
  motionDetection: false,
  mainRelay: false,
  buzzer: false,
};

const checkFirebaseInit = () => {
  if (initError) {
    throw initError;
  }
  if (!realtimeDb) {
    throw new Error(
      "Firebase Realtime Database not initialized. " +
      "Please fill in VITE_FIREBASE_* environment variables. " +
      "See FIREBASE_SETUP.md for instructions."
    );
  }
};

export const listenSensors = (
  onData: (data: SensorsPayload) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  checkFirebaseInit();
  // Match ESP32 firmware path: properties/property_001/rooms/room_001/latest
  const sensorsRef = ref(realtimeDb!, "properties/property_001/rooms/room_001/latest");

  return onValue(
    sensorsRef,
    (snapshot) => {
      const value = snapshot.val() || {};
      onData({
        ...sensorDefaults,
        ...value,
      });
    },
    (error) => {
      onError?.(error);
    }
  );
};

export const listenDevices = (
  onData: (data: DevicesPayload) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  checkFirebaseInit();
  // Match ESP32 firmware path: properties/property_001/rooms/room_001/devices
  const devicesRef = ref(realtimeDb!, "properties/property_001/rooms/room_001/devices");

  return onValue(
    devicesRef,
    (snapshot) => {
      const value = snapshot.val() || {};
      onData({
        ...deviceDefaults,
        ...value,
      });
    },
    (error) => {
      onError?.(error);
    }
  );
};

export const updateDevice = async (
  deviceId: keyof Omit<DevicesPayload, "updatedAt">,
  state: boolean,
  automated: boolean = false
) => {
  checkFirebaseInit();
  // Match ESP32 firmware path: properties/property_001/rooms/room_001/devices
  await update(ref(realtimeDb!, "properties/property_001/rooms/room_001/devices"), {
    [deviceId]: state,
    updatedAt: serverTimestamp(),
    automatedFlag: automated // For logging/tracking automated changes
  });
};

export const pushAlert = async (alert: AlertPayload) => {
  checkFirebaseInit();
  const alertsRef = ref(realtimeDb!, "properties/property_001/alerts");
  const newAlertRef = push(alertsRef);

  await set(newAlertRef, {
    ...alert,
    acknowledged: false,
    createdAt: serverTimestamp(),
  });

  return newAlertRef.key;
};

export const listenAlerts = (
  onData: (data: AlertRecord[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  checkFirebaseInit();
  const alertsRef = ref(realtimeDb!, "properties/property_001/alerts");

  return onValue(
    alertsRef,
    (snapshot) => {
      const value = snapshot.val() || {};
      const alerts: AlertRecord[] = Object.entries(value).map(([id, entry]) => {
        const alert = entry as Omit<AlertRecord, "id">;
        return {
          id,
          type: alert.type,
          title: alert.title,
          message: alert.message,
          source: alert.source,
          acknowledged: Boolean(alert.acknowledged),
          createdAt: alert.createdAt,
        };
      });

      alerts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      onData(alerts);
    },
    (error) => {
      onError?.(error);
    }
  );
};

export const acknowledgeAlert = async (alertId: string, acknowledged = true) => {
  checkFirebaseInit();
  await update(ref(realtimeDb!, `properties/property_001/alerts/${alertId}`), {
    acknowledged,
  });
};

export const deleteAlert = async (alertId: string) => {
  checkFirebaseInit();
  await remove(ref(realtimeDb!, `properties/property_001/alerts/${alertId}`));
};

export const clearAlerts = async () => {
  checkFirebaseInit();
  await remove(ref(realtimeDb!, "properties/property_001/alerts"));
};

// Listen to LED status in real-time (syncs from ESP32 feedback)
export const listenLEDStatus = (
  onData: (state: boolean) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  checkFirebaseInit();
  const ledRef = ref(realtimeDb!, "led");

  return onValue(
    ledRef,
    (snapshot) => {
      const value = snapshot.val();
      console.log("🔴 LED status from Firebase:", value);
      // Handle both 1/0 (numbers) and true/false (booleans)
      const isOn = value === 1 || value === true || value === "1" || value === "true";
      console.log("✅ LED is:", isOn ? "ON" : "OFF");
      onData(isOn);
    },
    (error) => {
      onError?.(error);
    }
  );
};

// ESP32 LED Control - sends 1 (ON) or 0 (OFF)
export const setLEDControl = async (state: boolean) => {
  checkFirebaseInit();
  const ledValue = state ? 1 : 0;
  console.log("⚡ Setting LED to:", ledValue);
  await set(ref(realtimeDb!, "led"), ledValue);
};
