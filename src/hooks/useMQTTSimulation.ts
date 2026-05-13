import { useState, useEffect, useCallback, useRef } from "react";
import {
  listenAlerts,
  listenFlow,
  listenDevices,
  listenSensors,
  listenLEDStatus,
  pushAlert,
  updateDevice,
  type AlertRecord,
  type FlowPayload,
  type DevicesPayload,
} from "../services/realtimeDbService";
import {
  calculateEnergySavings,
  calculateOccupancyConfidence,
  estimateTariffCost,
  inferOccupancyState,
  type OccupancyState,
  type TariffConfig,
} from "../lib/proposalLogic";

export interface SensorData {
  voltage: number;
  current: number;
  power: number;
  energy?: number;
  gas: number;
  water: number;
  motion: boolean;
  flowRate: number;
  flowTotalLiters: number;
  flowUpdatedAt: number | null;
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
  occupancyState: OccupancyState;
  occupancyConfidence: number;
  estimatedEnergyCost: number;
  estimatedSavings: number;
  lastUpdate: Date | null;
  toggleDevice: (device: keyof DeviceStates) => Promise<void>;
  ledStatus: 0 | 1 | null;
  ledError: string | null;
  togglingDevices: Set<string>;
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
  const DEFAULT_TARIFF: TariffConfig = {
    currency: "LKR",
    offPeak: { start: "22:30", end: "05:30", rate: 0 },
    day: { start: "05:30", end: "18:30", rate: 0 },
    peak: { start: "18:30", end: "22:30", rate: 0 },
  };
  const [sensorData, setSensorData] = useState<SensorData>({
    voltage: 0,
    current: 0,
    power: 0,
    energy: 0,
    gas: 0,
    water: 0,
    motion: false,
    flowRate: 0,
    flowTotalLiters: 0,
    flowUpdatedAt: null,
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
  const [ledStatus, setLedStatus] = useState<0 | 1 | null>(null);
  const [ledError, setLedError] = useState<string | null>(null);
  const [togglingDevices, setTogglingDevices] = useState<Set<string>>(new Set());
  const [occupancyState, setOccupancyState] = useState<OccupancyState>("VACANT");
  const [occupancyConfidence, setOccupancyConfidence] = useState(0);
  const [estimatedEnergyCost, setEstimatedEnergyCost] = useState(0);
  const [estimatedSavings, setEstimatedSavings] = useState(0);
  const thresholdsRef = useRef({ gasDangerActive: false, waterLowActive: false });
  const toggleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const occupancyRef = useRef<OccupancyState>("VACANT");
  const lastStateChangeRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const offSensors = listenSensors(
        (data) => {
          const now = Date.now();
          const sensorSnapshot = {
            motion: data.motion,
            pir: data.motion,
            doorOpen: data.doorOpen,
            ultrasonicPresence: data.ultrasonicPresence,
            voltage: data.voltage,
            current: data.current,
            power: data.power,
            energy: data.energy,
          };

          if (sensorSnapshot.motion || sensorSnapshot.doorOpen || sensorSnapshot.ultrasonicPresence) {
            lastActivityRef.current = now;
          }

          const nextOccupancyState = inferOccupancyState({
            currentState: occupancyRef.current,
            lastStateChangeAt: lastStateChangeRef.current,
            lastActivityAt: lastActivityRef.current,
            sensor: sensorSnapshot,
            now,
          });

          if (nextOccupancyState !== occupancyRef.current) {
            occupancyRef.current = nextOccupancyState;
            lastStateChangeRef.current = now;
          }

          setSensorData({
            voltage: data.voltage,
            current: data.current,
            power: data.power,
            energy: data.energy ?? 0,
            gas: data.gas,
            water: data.water,
            motion: data.motion,
            flowRate: data.flowRate,
            pir: data.motion,
            waterLevel: data.water,
          });
          setOccupancyState(nextOccupancyState);
          setOccupancyConfidence(calculateOccupancyConfidence(sensorSnapshot));
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
          console.log("📡 Device state updated from Firebase:", data);
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
          console.error("❌ Device listener error:", listenerError);
          setError(listenerError.message || "Failed to listen to devices.");
        }
      );

      const offFlow = listenFlow(
        (data: FlowPayload) => {
          setSensorData((prev) => ({
            ...prev,
            flowRate: data.rate,
            flowTotalLiters: data.totalLiters,
            flowUpdatedAt: data.timestamp ?? Date.now(),
          }));
          setError(null);
        },
        (listenerError) => {
          setError(listenerError.message || "Failed to listen to flow sensor.");
        }
      );

      // Listen to LED status for the indicator only (0 or 1)
      // Does NOT affect light switch control
      const offLED = listenLEDStatus(
        (ledState) => {
          console.log("🔴 LED indicator update:", ledState ? 1 : 0);
          setLedStatus(ledState ? 1 : 0);
          setLedError(null);
        },
        (listenerError) => {
          console.error("❌ LED listener error:", listenerError);
          setLedError(listenerError.message || "LED connection error");
          setLedStatus(null);
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
        offFlow();
        offLED();
        offAlerts();
      };
    } catch (initializationError) {
      const errorMsg =
        initializationError instanceof Error
          ? initializationError.message
          : "Failed to initialize Firebase. Check your environment variables.";
      setError(errorMsg);
      setLoading(false);
      return () => {
        /* cleanup */
      };
    }
  }, []);

  useEffect(() => {
    setLoading(!(isSensorReady && isDeviceReady));
  }, [isSensorReady, isDeviceReady]);

  useEffect(() => {
    const energyKWh = sensorData.energy ?? 0;
    const estimatedCost = estimateTariffCost(energyKWh, DEFAULT_TARIFF, lastUpdate?.getTime() ?? Date.now());
    const baselineCost = estimatedCost;
    const automatedCost = occupancyState === "VACANT" || occupancyState === "VACANT_CONFIRMED"
      ? estimatedCost * 0.8
      : estimatedCost;
    const savings = calculateEnergySavings(baselineCost, automatedCost);

    setEstimatedEnergyCost(estimatedCost);
    setEstimatedSavings(savings.savings);

  }, [lastUpdate, occupancyState, sensorData.energy]);

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
    // Prevent rapid consecutive clicks on same device
    setTogglingDevices(prev => {
      if (prev.has(device)) return prev;
      return new Set([...prev, device]);
    });

    const firebaseDeviceId = deviceAliasMap[device];
    const currentState = deviceStates[device];
    const newState = !currentState;

    console.log(`🔄 Toggle ${device}: ${currentState} → ${newState}`);

    try {
      // Update device state in Firebase
      console.log(`💾 Updating Firebase device: ${firebaseDeviceId} = ${newState}`);
      await updateDevice(firebaseDeviceId, newState);
      setError(null);
      
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : "Failed to update device.";
      console.error(`❌ Toggle error:`, message);
      setError(message);
    } finally {
      // Clear toggling state after minimum time
      if (toggleTimeoutRef.current) clearTimeout(toggleTimeoutRef.current);
      toggleTimeoutRef.current = setTimeout(() => {
        setTogglingDevices(prev => {
          const next = new Set(prev);
          next.delete(device);
          return next;
        });
      }, 300);
    }
  }, [deviceStates]);

  const connectionStatus = error
    ? "disconnected"
    : loading
    ? "connecting"
    : "connected";

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (toggleTimeoutRef.current) clearTimeout(toggleTimeoutRef.current);
    };
  }, []);

  return {
    sensorData,
    deviceStates,
    alerts,
    loading,
    error,
    isConnected: connectionStatus === "connected",
    connectionStatus,
    occupancyState,
    occupancyConfidence,
    estimatedEnergyCost,
    estimatedSavings,
    lastUpdate,
    toggleDevice,
    ledStatus,
    ledError,
    togglingDevices,
  };
}
