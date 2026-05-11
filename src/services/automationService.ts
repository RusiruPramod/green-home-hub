import { updateDevice, type DevicesPayload } from "./realtimeDbService";
import type { OccupancyState } from "./occupancyLogic";

// Define which devices are non-essential and should be turned off when vacant
const NON_ESSENTIAL_DEVICES: Array<keyof Omit<DevicesPayload, "updatedAt">> = [
  "light",
  "fan",
];

/**
 * Checks the occupancy state and turns off non-essential devices if vacant.
 */
export const runAutomationRules = async (
  occupancyState: OccupancyState,
  currentDeviceStates: DevicesPayload
) => {
  if (occupancyState === "VACANT_CONFIRMED") {
    // Turn off all non-essential devices
    for (const device of NON_ESSENTIAL_DEVICES) {
      if (currentDeviceStates[device] === true) {
        console.log(`[Automation] Turning off ${device} due to VACANT_CONFIRMED state`);
        await updateDevice(device, false, true);
      }
    }
  }
};
