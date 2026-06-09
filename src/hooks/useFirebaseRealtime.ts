import { useState, useEffect, useCallback, useRef } from "react";
import {
  listenAlerts,
  listenDevices,
  listenSensors,
  listenLEDStatus,
  pushAlert,
  updateDevice,
  setLEDControl,
  type AlertRecord,
  type DevicesPayload,
} from "@/services/realtimeDbService";

export interface SensorData {
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

export interface DeviceStates {
  lights: boolean;
  waterPump: boolean;
  exhaustFan: boolean;
  motionDetection: boolean;
  mainRelay: boolean;
  buzzer: boolean;
}

export interface SensorStatus {
  [key: string]: "online" | "offline";
  gas: "online" | "offline";
  temperature: "online" | "offline";
  humidity: "online" | "offline";
  water: "online" | "offline";
  voltage: "online" | "offline";
}

interface FirebaseRealtimeReturn {
  sensorData: SensorData;
  deviceStates: DeviceStates;
  alerts: AlertRecord[];
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  connectionStatus: "connected" | "connecting" | "disconnected";
  lastUpdate: Date | null;
  sensorStatus: SensorStatus;
  toggleDevice: (device: keyof DeviceStates) => Promise<void>;
  ledStatus: 0 | 1 | null;
  ledError: string | null;
  togglingDevices: Set<string>;
  isDataStale: boolean;
}

// Constants for stale data detection
const DATA_FRESHNESS_THRESHOLD_MS = 30_000; // 30 seconds

// Removed deviceAliasMap as states now match natively

export function useFirebaseRealtime(): FirebaseRealtimeReturn {
  const [sensorData, setSensorData] = useState<SensorData>({
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
  });
  const [deviceStates, setDeviceStates] = useState<DeviceStates>({
    lights: false,
    waterPump: false,
    exhaustFan: false,
    motionDetection: false,
    mainRelay: false,
    buzzer: false,
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
  const [sensorStatus, setSensorStatus] = useState<SensorStatus>({
    gas: "offline",
    temperature: "offline",
    humidity: "offline",
    water: "offline",
    voltage: "offline",
  });
  const [isDataStale, setIsDataStale] = useState(false);
  const thresholdsRef = useRef({ gasDangerActive: false, waterLowActive: false });
  const toggleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to determine if data is stale
  const checkDataFreshness = useCallback((lastUpdateTime: number | undefined) => {
    if (!lastUpdateTime) return true;
    const ageMs = Date.now() - lastUpdateTime;
    return ageMs > DATA_FRESHNESS_THRESHOLD_MS;
  }, []);

  // Update sensor status based on data freshness
  const updateSensorStatus = useCallback((lastUpdateTime: number | undefined) => {
    const stale = checkDataFreshness(lastUpdateTime);
    const status: SensorStatus = {
      gas: stale ? "offline" : "online",
      temperature: stale ? "offline" : "online",
      humidity: stale ? "offline" : "online",
      water: stale ? "offline" : "online",
      voltage: stale ? "offline" : "online",
    };
    setSensorStatus(status);
    setIsDataStale(stale);
  }, [checkDataFreshness]);

  useEffect(() => {
    try {
      const offSensors = listenSensors(
        (data) => {
          // Log water sensor updates for debugging
          if (data.waterLevel !== undefined || data.flowRate !== undefined || data.totalLiters !== undefined) {
            console.log("💧 Firebase Sensor Update - Water Data:", {
              waterLevel: data.waterLevel,
              flowRate: data.flowRate,
              totalLiters: data.totalLiters,
              timestamp: new Date().toLocaleTimeString(),
            });
          }
          setSensorData({
            voltage: data.voltage,
            current: data.current,
            power: data.power,
            energy: data.energy,
            gas: data.gas,
            pir: data.pir,
            doorOpen: data.doorOpen,
            temperature: data.temperature,
            humidity: data.humidity,
            lightLevel: data.lightLevel,
            waterLevel: data.waterLevel,
            flowRate: data.flowRate,
            totalLiters: data.totalLiters,
            relayStatus: data.relayStatus,
            buzzerStatus: data.buzzerStatus,
            occupancyState: data.occupancyState,
            updatedAt: data.updatedAt,
          });
          setIsSensorReady(true);
          setLastUpdate(data.updatedAt ? new Date(data.updatedAt) : new Date());
          // Update sensor status based on data freshness
          updateSensorStatus(data.updatedAt);
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
            lights: data.lights,
            waterPump: data.waterPump,
            exhaustFan: data.exhaustFan,
            motionDetection: data.motionDetection,
            mainRelay: data.mainRelay,
            buzzer: data.buzzer,
          });
          setIsDeviceReady(true);
          setError(null);
        },
        (listenerError) => {
          console.error("❌ Device listener error:", listenerError);
          setError(listenerError.message || "Failed to listen to devices.");
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

  // Removed client-side alert pushing to prevent database spam when multiple components mount the hook.
  // In a real system, alerts should be generated by the ESP32 firmware or a backend service, not the frontend UI.

  const toggleDevice = useCallback(async (device: keyof DeviceStates) => {
    // Prevent rapid consecutive clicks on same device
    setTogglingDevices(prev => {
      if (prev.has(device)) return prev;
      return new Set([...prev, device]);
    });

    const firebaseDeviceId = device;
    const currentState = deviceStates[device];
    const newState = !currentState;

    console.log(`🔄 Toggle ${device}: ${currentState} → ${newState}`);

    try {
      // For light device, update /led (ESP32) 
      if (device === "lights") {
        console.log(`⚡ Sending LED control: ${newState ? 1 : 0}`);
        await setLEDControl(newState);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Update device state in Firebase
      console.log(`💾 Updating Firebase device: ${firebaseDeviceId} = ${newState}`);
      await updateDevice(firebaseDeviceId as any, newState);
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
    lastUpdate,
    sensorStatus,
    toggleDevice,
    ledStatus,
    ledError,
    togglingDevices,
    isDataStale,
  };
}
