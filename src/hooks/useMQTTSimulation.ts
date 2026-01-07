import { useState, useEffect, useCallback } from "react";

export interface SensorData {
  voltage: number;
  current: number;
  power: number;
  gas: number;
  pir: boolean;
  waterLevel: number;
  flowRate: number;
}

export interface DeviceStates {
  lights: boolean;
  waterPump: boolean;
  exhaustFan: boolean;
  motionDetection: boolean;
}

interface MQTTSimulationReturn {
  sensorData: SensorData;
  deviceStates: DeviceStates;
  isConnected: boolean;
  connectionStatus: "connected" | "connecting" | "disconnected";
  lastUpdate: Date | null;
  toggleDevice: (device: keyof DeviceStates) => void;
}

// Random values pool for sensor readings
const RANDOM_VALUES = [34, 34, 78, 4, 785, 455, 900, 1000, 2200, 35, 666, 444, 785, 446, 3, 3, 8, 305];

// Get random value from the pool
const getRandomValue = () => {
  return RANDOM_VALUES[Math.floor(Math.random() * RANDOM_VALUES.length)];
};

// Simulate realistic sensor value fluctuations
const fluctuate = (base: number, variance: number, min?: number, max?: number) => {
  const change = (Math.random() - 0.5) * variance * 2;
  let newValue = base + change;
  if (min !== undefined) newValue = Math.max(min, newValue);
  if (max !== undefined) newValue = Math.min(max, newValue);
  return Number(newValue.toFixed(2));
};

export function useMQTTSimulation(): MQTTSimulationReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected">("disconnected");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const [sensorData, setSensorData] = useState<SensorData>({
    voltage: getRandomValue(),
    current: getRandomValue(),
    power: getRandomValue(),
    gas: getRandomValue(),
    pir: false,
    waterLevel: getRandomValue(),
    flowRate: getRandomValue(),
  });

  const [deviceStates, setDeviceStates] = useState<DeviceStates>({
    lights: true,
    waterPump: false,
    exhaustFan: true,
    motionDetection: true,
  });

  // Simulate MQTT connection
  useEffect(() => {
    setConnectionStatus("connecting");
    
    const connectTimeout = setTimeout(() => {
      setIsConnected(true);
      setConnectionStatus("connected");
      console.log("[MQTT] Connected to ESP32 simulator");
    }, 1500);

    return () => clearTimeout(connectTimeout);
  }, []);

  // Simulate real-time sensor updates
  useEffect(() => {
    if (!isConnected) return;

    const updateInterval = setInterval(() => {
      setSensorData((prev) => {
        // Use random values from the pool
        const newVoltage = getRandomValue();
        const newCurrent = getRandomValue();
        const newPower = getRandomValue();
        const newGas = getRandomValue();
        const newWaterLevel = getRandomValue();
        const newFlowRate = getRandomValue();

        // Random PIR triggers
        const newPir = deviceStates.motionDetection && Math.random() < 0.1;

        return {
          voltage: newVoltage,
          current: newCurrent,
          power: newPower,
          gas: newGas,
          pir: newPir,
          waterLevel: Number(newWaterLevel.toFixed(1)),
          flowRate: Number(newFlowRate.toFixed(1)),
        };
      });

      setLastUpdate(new Date());
    }, 2000);

    return () => clearInterval(updateInterval);
  }, [isConnected, deviceStates.waterPump, deviceStates.motionDetection]);

  const toggleDevice = useCallback((device: keyof DeviceStates) => {
    setDeviceStates((prev) => {
      const newState = !prev[device];
      console.log(`[MQTT] Publishing: ${device} -> ${newState ? "ON" : "OFF"}`);
      return { ...prev, [device]: newState };
    });
  }, []);

  return {
    sensorData,
    deviceStates,
    isConnected,
    connectionStatus,
    lastUpdate,
    toggleDevice,
  };
}
