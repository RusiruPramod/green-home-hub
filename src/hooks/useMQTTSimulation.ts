import { useState, useEffect, useCallback, useRef } from "react";
import {
  listenAlerts,
  listenDevices,
  listenSensors,
  pushAlert,
  updateDevice,
  type AlertRecord,
  type DevicesPayload,
} from "@/services/realtimeDbService";

export interface SensorData {
  voltage: number;
  current: number;
  power: number;
  gas: number;
  water: number;
  motion: boolean;
  flowRate: number;
  pir: boolean;
  waterLevel: number;
}

export interface DeviceStates {
  light: boolean;
  pump: boolean;
  fan: boolean;
  motionDetection: boolean;
  lights: boolean;
  waterPump: boolean;
  exhaustFan: boolean;
}

interface MQTTSimulationReturn {
  sensorData: SensorData;
  deviceStates: DeviceStates;
  alerts: AlertRecord[];
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  connectionStatus: "connected" | "connecting" | "disconnected";
  lastUpdate: Date | null;
  toggleDevice: (device: keyof DeviceStates) => Promise<void>;
}

const deviceAliasMap: Record<keyof DeviceStates, keyof Omit<DevicesPayload, "updatedAt">> = {
  light: "light",
  pump: "pump",
  fan: "fan",
  motionDetection: "motionDetection",
  lights: "light",
  waterPump: "pump",
  exhaustFan: "fan",
};

export function useMQTTSimulation(): MQTTSimulationReturn {
  const [sensorData, setSensorData] = useState<SensorData>({
    voltage: 0,
    current: 0,
    power: 0,
    gas: 0,
    water: 0,
    motion: false,
    flowRate: 0,
    pir: false,
    waterLevel: 0,
  });
  const [deviceStates, setDeviceStates] = useState<DeviceStates>({
    light: false,
    pump: false,
    fan: false,
    motionDetection: false,
    lights: false,
    waterPump: false,
    exhaustFan: false,
  });
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isSensorReady, setIsSensorReady] = useState(false);
  const [isDeviceReady, setIsDeviceReady] = useState(false);
  const thresholdsRef = useRef({ gasDangerActive: false, waterLowActive: false });

  useEffect(() => {
    const offSensors = listenSensors(
      (data) => {
        setSensorData({
          voltage: data.voltage,
          current: data.current,
          power: data.power,
          gas: data.gas,
          water: data.water,
          motion: data.motion,
          flowRate: data.flowRate,
          pir: data.motion,
          waterLevel: data.water,
        });
        setIsSensorReady(true);
        setLastUpdate(data.updatedAt ? new Date(data.updatedAt) : new Date());
        setError(null);
      },
      (listenerError) => {
        setError(listenerError.message || "Failed to listen to sensors.");
      }
    );

    const offDevices = listenDevices(
      (data) => {
        setDeviceStates({
          light: data.light,
          pump: data.pump,
          fan: data.fan,
          motionDetection: data.motionDetection,
          lights: data.light,
          waterPump: data.pump,
          exhaustFan: data.fan,
        });
        setIsDeviceReady(true);
        setError(null);
      },
      (listenerError) => {
        setError(listenerError.message || "Failed to listen to devices.");
      }
    );

    const offAlerts = listenAlerts(
      (items) => {
        setAlerts(items);
      },
      (listenerError) => {
        setError(listenerError.message || "Failed to listen to alerts.");
      }
    );

    return () => {
      offSensors();
      offDevices();
      offAlerts();
    };
  }, []);

  useEffect(() => {
    setLoading(!(isSensorReady && isDeviceReady));
  }, [isSensorReady, isDeviceReady]);

  useEffect(() => {
    const checkThresholds = async () => {
      if (sensorData.gas > 500 && !thresholdsRef.current.gasDangerActive) {
        thresholdsRef.current.gasDangerActive = true;
        await pushAlert({
          type: "danger",
          title: "Critical Gas Alert",
          message: `Gas level is ${Math.round(sensorData.gas)} ppm (threshold > 500).`,
          source: "gas",
        });
      } else if (sensorData.gas <= 500) {
        thresholdsRef.current.gasDangerActive = false;
      }

      if (sensorData.water < 30 && !thresholdsRef.current.waterLowActive) {
        thresholdsRef.current.waterLowActive = true;
        await pushAlert({
          type: "warning",
          title: "Low Water Level",
          message: `Water tank level is ${Math.round(sensorData.water)}% (threshold < 30%).`,
          source: "water",
        });
      } else if (sensorData.water >= 30) {
        thresholdsRef.current.waterLowActive = false;
      }
    };

    void checkThresholds().catch((thresholdError: Error) => {
      setError(thresholdError.message || "Failed to push threshold alert.");
    });
  }, [sensorData.gas, sensorData.water]);

  const toggleDevice = useCallback(async (device: keyof DeviceStates) => {
    const firebaseDeviceId = deviceAliasMap[device];
    const currentState = deviceStates[device];

    try {
      await updateDevice(firebaseDeviceId, !currentState);
      setError(null);
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : "Failed to update device.";
      setError(message);
    }
  }, [deviceStates]);

  const connectionStatus = error
    ? "disconnected"
    : loading
    ? "connecting"
    : "connected";

  return {
    sensorData,
    deviceStates,
    alerts,
    loading,
    error,
    isConnected: connectionStatus === "connected",
    connectionStatus,
    lastUpdate,
    toggleDevice,
  };
}
