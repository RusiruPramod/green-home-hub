import { useState, useEffect } from "react";
import {
  listenWaterHistory,
  calculateTodayUsage,
  getWeeklyWaterUsage,
  type WaterUsageRecord,
  type DailyWaterUsage,
} from "@/services/waterService";

export interface UseWaterDataReturn {
  waterHistory: WaterUsageRecord[];
  todayUsage: number;
  weeklyUsage: DailyWaterUsage[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch and calculate water usage data in real-time
 */
export function useWaterData(): UseWaterDataReturn {
  const [waterHistory, setWaterHistory] = useState<WaterUsageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = listenWaterHistory(
      (records) => {
        console.log("💧 Water history updated:", {
          recordCount: records.length,
          latestRecords: records.slice(0, 3),
        });
        setWaterHistory(records);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("❌ Water history error:", err);
        setError(err.message || "Failed to fetch water history");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const todayUsage = calculateTodayUsage(waterHistory);
  const weeklyUsage = getWeeklyWaterUsage(waterHistory);

  return {
    waterHistory,
    todayUsage,
    weeklyUsage,
    loading,
    error,
  };
}
