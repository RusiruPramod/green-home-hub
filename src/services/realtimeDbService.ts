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
import { realtimeDb } from "@/services/firebase";

export interface SensorsPayload {
  gas: number;
  water: number;
  voltage: number;
  current: number;
  power: number;
  motion: boolean;
  flowRate: number;
  updatedAt?: number;
}

export interface DevicesPayload {
  light: boolean;
  pump: boolean;
  fan: boolean;
  motionDetection: boolean;
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
  gas: 0,
  water: 0,
  voltage: 0,
  current: 0,
  power: 0,
  motion: false,
  flowRate: 0,
};

const deviceDefaults: DevicesPayload = {
  light: false,
  pump: false,
  fan: false,
  motionDetection: false,
};

export const listenSensors = (
  onData: (data: SensorsPayload) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const sensorsRef = ref(realtimeDb, "sensors");

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
  const devicesRef = ref(realtimeDb, "devices");

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
  state: boolean
) => {
  await update(ref(realtimeDb, "devices"), {
    [deviceId]: state,
    updatedAt: serverTimestamp(),
  });
};

export const pushAlert = async (alert: AlertPayload) => {
  const alertsRef = ref(realtimeDb, "alerts");
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
  const alertsRef = ref(realtimeDb, "alerts");

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
  await update(ref(realtimeDb, `alerts/${alertId}`), {
    acknowledged,
  });
};

export const deleteAlert = async (alertId: string) => {
  await remove(ref(realtimeDb, `alerts/${alertId}`));
};

export const clearAlerts = async () => {
  await remove(ref(realtimeDb, "alerts"));
};
