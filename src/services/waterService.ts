import { ref, onValue, type Unsubscribe } from "firebase/database";
import { realtimeDb } from "@/services/firebase";

export interface WaterUsageRecord {
  roomId: string;
  flowRate: number;
  createdAt: number;
}

export interface DailyWaterUsage {
  day: string;
  usage: number; // in liters
  date?: Date;
}

/**
 * Listen to water usage history in real-time
 */
export const listenWaterHistory = (
  onData: (records: WaterUsageRecord[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  if (!realtimeDb) {
    const error = new Error("Firebase Realtime Database not initialized");
    onError?.(error);
    return () => {};
  }

  const historyRef = ref(realtimeDb, "properties/property_001/history");

  return onValue(
    historyRef,
    (snapshot) => {
      const data = snapshot.val() || {};
      const records: WaterUsageRecord[] = Object.entries(data)
        .map(([_, entry]) => entry as WaterUsageRecord)
        .filter((record) => record.flowRate !== undefined)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      onData(records);
    },
    (error) => {
      onError?.(error);
    }
  );
};

/**
 * Calculate today's water usage from history records
 * Uses the flow rate data to estimate consumption
 */
export const calculateTodayUsage = (records: WaterUsageRecord[]): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayRecords = records.filter((record) => {
    const recordDate = new Date(record.createdAt);
    recordDate.setHours(0, 0, 0, 0);
    return recordDate.getTime() === today.getTime();
  });

  // Approximate usage: flow rate * time interval (assuming 3 second intervals)
  // This is a rough estimate; actual water meter would be more accurate
  const totalUsage = todayRecords.reduce((sum, record) => {
    return sum + (record.flowRate || 0) * 0.05; // ~3 seconds per reading = 0.05 min
  }, 0);

  return Math.round(totalUsage * 100) / 100; // Round to 2 decimals
};

/**
 * Aggregate water usage by day for weekly view
 */
export const getWeeklyWaterUsage = (records: WaterUsageRecord[]): DailyWaterUsage[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Create 7 day objects
  const days: Record<string, { usage: number; date: Date }> = {};
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayName = dayNames[date.getDay()];
    const dateKey = date.toISOString().split("T")[0];
    days[dateKey] = { usage: 0, date };
  }

  // Aggregate flow rate data
  records.forEach((record) => {
    const dateStr = new Date(record.createdAt).toISOString().split("T")[0];
    if (days[dateStr]) {
      days[dateStr].usage += (record.flowRate || 0) * 0.05; // 3 second intervals
    }
  });

  // Convert to array
  const dayNames2 = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return Object.values(days).map((data, index) => ({
    day: dayNames2[index % 7],
    usage: Math.round(data.usage * 100) / 100,
    date: data.date,
  }));
};

/**
 * Get average flow rate from recent records
 */
export const getAverageFlowRate = (records: WaterUsageRecord[], limitHours = 1): number => {
  const cutoffTime = Date.now() - limitHours * 60 * 60 * 1000;
  const recentRecords = records.filter((r) => r.createdAt > cutoffTime);

  if (recentRecords.length === 0) return 0;

  const total = recentRecords.reduce((sum, r) => sum + (r.flowRate || 0), 0);
  return Math.round((total / recentRecords.length) * 100) / 100;
};
