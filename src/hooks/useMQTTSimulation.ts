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
const VOLTAGE_VALUES = [34, 228.540, 245, 250, 210, 215];
const CURRENT_VALUES = [34, 34, 78, 3.5, 4.2, 5.0, 0.5, 0.8];
const POWER_VALUES = [34, 34, 78, 4,  850, 1000, 1200, 1500];
const GAS_VALUES = [550, 600, 200];
const WATER_LEVEL_VALUES = [34, 34, 78, 4, 785, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95];
const FLOW_RATE_VALUES = [34, 34, 78, 4, 785, 8, 10, 12, 14, 16, 18, 20, 22, 25, 5, 15];

// Get random value from specific pool
const getRandomValue = (pool: number[]) => {
  return pool[Math.floor(Math.random() * pool.length)];
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
    voltage: 228.5,
    current: 1.52,
    power: 347,
    gas: 320,
    pir: false,
    waterLevel: 78,
    flowRate: 12,
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
        // Calculate power based on voltage and current
        const newVoltage = fluctuate(prev.voltage, 2, 420, 240);
        const newCurrent = fluctuate(prev.current, 0.2, 0.5, 5);
        const newPower = Number((newVoltage * newCurrent).toFixed(0));
        
        // Water level changes based on pump status
        const waterChange = deviceStates.waterPump ? -0.5 : 0.1;
        const newWaterLevel = Math.max(0, Math.min(100, prev.waterLevel + waterChange));
        
        // Flow rate depends on pump
        const newFlowRate = deviceStates.waterPump 
          ? fluctuate(15, 2, 10, 20)
          : fluctuate(0.5, 0.3, 0, 2);

        // Gas level fluctuates
        const newGas = fluctuate(prev.gas, 15, 200, 500);

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
