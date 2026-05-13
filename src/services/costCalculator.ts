// costCalculator.ts
import { ref, get } from "firebase/database";
import { realtimeDb } from "@/services/firebase";

export interface TariffBlock {
  start: string; // e.g., "22:30"
  end: string;   // e.g., "05:30"
  rate: number;
}

export interface TariffRates {
  category: string;
  currency: string;
  fixedCharge: number;
  offPeak: TariffBlock;
  day: TariffBlock;
  peak: TariffBlock;
}

export type TimeBlock = 'offPeak' | 'day' | 'peak';

/**
 * Parses "HH:mm" into minutes since midnight for easier comparison
 */
const parseTime = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Determines the current active tariff block based on the provided date (or now)
 */
export const getActiveTariffBlock = (tariffs: TariffRates, date: Date = new Date()): { block: TimeBlock; rate: number } => {
  const currentMinutes = date.getHours() * 60 + date.getMinutes();

  const dayStart = parseTime(tariffs.day.start);
  const peakStart = parseTime(tariffs.peak.start);
  const offPeakStart = parseTime(tariffs.offPeak.start);

  // Day: 05:30 to 18:30
  if (currentMinutes >= dayStart && currentMinutes < peakStart) {
    return { block: 'day', rate: tariffs.day.rate };
  }
  
  // Peak: 18:30 to 22:30
  if (currentMinutes >= peakStart && currentMinutes < offPeakStart) {
    return { block: 'peak', rate: tariffs.peak.rate };
  }
  
  // Off-Peak: 22:30 to 05:30 (crosses midnight)
  return { block: 'offPeak', rate: tariffs.offPeak.rate };
};

/**
 * Calculates the cost for a given energy delta in kWh
 * This is used for real-time aggregation
 */
export const calculateCostForEnergy = (energyKwh: number, activeRate: number): number => {
  return energyKwh * activeRate;
};

/**
 * Calculates theoretical avoided cost if appliances were left on
 * @param powerKw The continuous power load in kW (e.g., 2.5 kW for AC + Geyser)
 * @param durationHours The duration of the vacancy in hours
 * @param activeRate The current active LKR rate
 */
export const calculateAvoidedCost = (powerKw: number, durationHours: number, activeRate: number): number => {
  const energySaved = powerKw * durationHours;
  return energySaved * activeRate;
};

/**
 * Fetches tariff rates from the global central path (globalSettings/tariffs).
 * Falls back to property-level path if global is not available.
 */
export const fetchGlobalTariffs = async (propertyId?: string): Promise<TariffRates | null> => {
  if (!realtimeDb) return null;
  
  try {
    const globalSnap = await get(ref(realtimeDb, "globalSettings/tariffs"));
    if (globalSnap.exists()) return globalSnap.val();
    
    // Fallback to property-level
    if (propertyId) {
      const propSnap = await get(ref(realtimeDb, `properties/${propertyId}/settings/tariffs`));
      if (propSnap.exists()) return propSnap.val();
    }
  } catch (error) {
    console.error("Failed to fetch tariffs:", error);
  }
  
  return null;
};

