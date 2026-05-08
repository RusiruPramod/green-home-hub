export type OccupancyState =
  | "VACANT"
  | "ENTRY_DETECTED"
  | "OCCUPIED_ACTIVE"
  | "OCCUPIED_IDLE"
  | "OCCUPIED_SLEEPING"
  | "EXIT_PENDING"
  | "VACANT_CONFIRMED";

export interface ProposalSensorSnapshot {
  motion: boolean;
  pir?: boolean;
  doorOpen?: boolean;
  ultrasonicPresence?: boolean;
  voltage?: number;
  current?: number;
  power?: number;
  energy?: number;
}

export interface ProposalOccupancyInput {
  currentState: OccupancyState;
  lastStateChangeAt: number | null;
  lastActivityAt: number | null;
  sensor: ProposalSensorSnapshot;
  now: number;
  vacancyTimeoutMs?: number;
}

export interface TariffWindow {
  start: string;
  end: string;
  rate: number;
}

export interface TariffConfig {
  currency?: string;
  offPeak: TariffWindow;
  day: TariffWindow;
  peak: TariffWindow;
}

export interface CostBreakdown {
  offPeakKWh: number;
  dayKWh: number;
  peakKWh: number;
  offPeakCost: number;
  dayCost: number;
  peakCost: number;
  totalCost: number;
}

const DEFAULT_VACANCY_TIMEOUT_MS = 5 * 60 * 1000;

const parseMinutes = (time: string) => {
  const [hoursText, minutesText] = time.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText ?? "0");
  return hours * 60 + minutes;
};

const withinWindow = (minutes: number, start: string, end: string) => {
  const startMinutes = parseMinutes(start);
  const endMinutes = parseMinutes(end);

  if (startMinutes <= endMinutes) {
    return minutes >= startMinutes && minutes < endMinutes;
  }

  return minutes >= startMinutes || minutes < endMinutes;
};

export const inferOccupancyState = ({
  currentState,
  lastStateChangeAt,
  lastActivityAt,
  sensor,
  now,
  vacancyTimeoutMs = DEFAULT_VACANCY_TIMEOUT_MS,
}: ProposalOccupancyInput): OccupancyState => {
  const motion = Boolean(sensor.motion || sensor.pir || sensor.ultrasonicPresence);
  const doorOpen = Boolean(sensor.doorOpen);
  const inactiveDuration = lastActivityAt ? now - lastActivityAt : Infinity;
  const stateAge = lastStateChangeAt ? now - lastStateChangeAt : Infinity;

  if (motion && doorOpen) {
    return "OCCUPIED_ACTIVE";
  }

  if (motion) {
    return currentState === "VACANT" || currentState === "VACANT_CONFIRMED"
      ? "ENTRY_DETECTED"
      : "OCCUPIED_ACTIVE";
  }

  if (doorOpen) {
    return currentState === "VACANT" ? "ENTRY_DETECTED" : "EXIT_PENDING";
  }

  if (
    (currentState === "OCCUPIED_ACTIVE" || currentState === "ENTRY_DETECTED") &&
    inactiveDuration >= vacancyTimeoutMs
  ) {
    return "OCCUPIED_IDLE";
  }

  if (currentState === "OCCUPIED_IDLE" && inactiveDuration >= vacancyTimeoutMs * 2) {
    return "OCCUPIED_SLEEPING";
  }

  if (currentState === "EXIT_PENDING" && inactiveDuration >= vacancyTimeoutMs) {
    return "VACANT_CONFIRMED";
  }

  if (currentState === "VACANT_CONFIRMED" && stateAge >= vacancyTimeoutMs) {
    return "VACANT";
  }

  if (currentState === "OCCUPIED_SLEEPING" && inactiveDuration >= vacancyTimeoutMs * 3) {
    return "VACANT_CONFIRMED";
  }

  return currentState;
};

export const calculateOccupancyConfidence = (sensor: ProposalSensorSnapshot) => {
  let confidence = 0.1;

  if (sensor.motion || sensor.pir) confidence += 0.4;
  if (sensor.doorOpen) confidence += 0.25;
  if (sensor.ultrasonicPresence) confidence += 0.25;
  if ((sensor.current ?? 0) > 0.15 || (sensor.power ?? 0) > 20) confidence += 0.1;

  return Math.max(0, Math.min(1, Number(confidence.toFixed(2))));
};

export const estimateTariffCost = (
  kWh: number,
  tariff: TariffConfig,
  timestamp: number = Date.now()
): number => {
  const minutes = new Date(timestamp).getHours() * 60 + new Date(timestamp).getMinutes();

  if (withinWindow(minutes, tariff.peak.start, tariff.peak.end)) {
    return kWh * tariff.peak.rate;
  }

  if (withinWindow(minutes, tariff.offPeak.start, tariff.offPeak.end)) {
    return kWh * tariff.offPeak.rate;
  }

  return kWh * tariff.day.rate;
};

export const calculateCostBreakdown = (
  consumption: { offPeakKWh: number; dayKWh: number; peakKWh: number },
  tariff: TariffConfig
): CostBreakdown => {
  const offPeakCost = consumption.offPeakKWh * tariff.offPeak.rate;
  const dayCost = consumption.dayKWh * tariff.day.rate;
  const peakCost = consumption.peakKWh * tariff.peak.rate;

  return {
    offPeakKWh: consumption.offPeakKWh,
    dayKWh: consumption.dayKWh,
    peakKWh: consumption.peakKWh,
    offPeakCost,
    dayCost,
    peakCost,
    totalCost: offPeakCost + dayCost + peakCost,
  };
};

export const calculateEnergySavings = (baselineCost: number, automatedCost: number) => {
  const savings = baselineCost - automatedCost;
  const savingsPercent = baselineCost > 0 ? (savings / baselineCost) * 100 : 0;

  return {
    savings,
    savingsPercent: Number(savingsPercent.toFixed(2)),
  };
};
