import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { realtimeDb } from "@/services/firebase";

export interface HistoryRecord {
  roomId: string;
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
  createdAt: number;
}

export interface AggregatedDay {
  day: string;
  energy: number;
  water: number; // Simulated or actual if added later
  cost: number;
}

export interface AggregatedMonth {
  month: string;
  current: number;
  previous: number;
}

export function useHistoryData() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const historyRef = ref(realtimeDb, "properties/property_001/history");
    
    const unsubscribe = onValue(historyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const records: HistoryRecord[] = Object.values(data);
        // Sort by time ascending
        records.sort((a, b) => a.createdAt - b.createdAt);
        setHistory(records);
      } else {
        setHistory([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Aggregate data for the charts
  const getWeeklyAggregation = (): AggregatedDay[] => {
    if (history.length === 0) {
      // Return empty chart structure
      return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => ({
        day, energy: 0, water: 0, cost: 0
      }));
    }

    // A real implementation would group by day of week.
    // For this prototype, we'll map the last 7 distinct days if available.
    // Group by Date string
    const grouped = history.reduce((acc, curr) => {
      const dateStr = new Date(curr.createdAt).toLocaleDateString("en-US", { weekday: 'short' });
      if (!acc[dateStr]) {
        acc[dateStr] = { energy: 0, count: 0 };
      }
      acc[dateStr].energy += curr.energy;
      acc[dateStr].count += 1;
      return acc;
    }, {} as Record<string, { energy: number; count: number }>);

    const result: AggregatedDay[] = [];
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    for (const day of days) {
      if (grouped[day]) {
        result.push({
          day,
          energy: parseFloat(grouped[day].energy.toFixed(2)),
          water: 0, // Placeholder
          cost: parseFloat((grouped[day].energy * 15).toFixed(2)) // Placeholder simple day rate
        });
      } else {
        result.push({ day, energy: 0, water: 0, cost: 0 });
      }
    }
    return result;
  };

  const getMonthlyAggregation = (): AggregatedMonth[] => {
    if (history.length === 0) {
      return [
        { month: "Current", current: 0, previous: 0 }
      ];
    }
    
    // Simplistic grouping by month
    const grouped = history.reduce((acc, curr) => {
      const monthStr = new Date(curr.createdAt).toLocaleDateString("en-US", { month: 'short' });
      if (!acc[monthStr]) acc[monthStr] = 0;
      acc[monthStr] += curr.energy;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([month, val]) => ({
      month,
      current: parseFloat(val.toFixed(2)),
      previous: parseFloat((val * 0.9).toFixed(2)) // Fake previous data for comparison
    }));
  };

  return {
    history,
    loading,
    weeklyData: getWeeklyAggregation(),
    monthlyData: getMonthlyAggregation(),
  };
}
