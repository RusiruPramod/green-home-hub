export type OccupancyState = 
  | "VACANT"
  | "ENTRY_DETECTED"
  | "OCCUPIED_ACTIVE"
  | "OCCUPIED_IDLE"
  | "OCCUPIED_SLEEPING"
  | "EXIT_PENDING"
  | "VACANT_CONFIRMED";

export interface OccupancyContext {
  state: OccupancyState;
  lastMotionAt: number;
  lastDoorChangeAt: number;
  doorOpen: boolean;
}

export interface OccupancyConfig {
  idleTimeoutSeconds: number; // e.g. 300 (5 mins)
  vacancyTimeoutSeconds: number; // e.g. 600 (10 mins)
}

/**
 * Calculates the next occupancy state based on sensor inputs and timeouts.
 */
export const calculateNextState = (
  currentCtx: OccupancyContext,
  newPir: boolean,
  newDoorOpen: boolean,
  config: OccupancyConfig,
  currentTime = Date.now()
): OccupancyContext => {
  const ctx = { ...currentCtx };
  
  // Update timestamps if sensors changed
  if (newDoorOpen !== ctx.doorOpen) {
    ctx.lastDoorChangeAt = currentTime;
    ctx.doorOpen = newDoorOpen;
  }
  if (newPir) {
    ctx.lastMotionAt = currentTime;
  }

  const secondsSinceMotion = (currentTime - ctx.lastMotionAt) / 1000;
  const secondsSinceDoor = (currentTime - ctx.lastDoorChangeAt) / 1000;

  // Hybrid State Machine Logic
  switch (ctx.state) {
    case "VACANT":
    case "VACANT_CONFIRMED":
      // If door opens or motion detected while vacant, assume entry
      if (newDoorOpen) {
        ctx.state = "ENTRY_DETECTED";
      } else if (newPir) {
        // Edge case: someone was already inside but not moving, or door was left open
        ctx.state = "OCCUPIED_ACTIVE";
      }
      break;

    case "ENTRY_DETECTED":
      // After entering, if they move around, they are active
      if (newPir) {
        ctx.state = "OCCUPIED_ACTIVE";
      } else if (!newDoorOpen && secondsSinceDoor > config.idleTimeoutSeconds) {
        // Door opened and closed, but no motion detected for a while. False alarm?
        ctx.state = "VACANT_CONFIRMED";
      }
      break;

    case "OCCUPIED_ACTIVE":
      if (newDoorOpen) {
        // Door opens while someone is inside. Could be leaving or someone else entering.
        ctx.state = "EXIT_PENDING";
      } else if (!newPir && secondsSinceMotion > config.idleTimeoutSeconds) {
        // No motion for a while, assume they are idle or sleeping
        ctx.state = "OCCUPIED_IDLE";
      }
      break;

    case "OCCUPIED_IDLE":
      if (newPir) {
        // They moved again
        ctx.state = "OCCUPIED_ACTIVE";
      } else if (secondsSinceMotion > config.vacancyTimeoutSeconds) {
        // This is the tricky part. If they haven't moved in a long time, but the door hasn't opened,
        // they are likely sleeping, NOT vacant. We do NOT transition to vacant unless the door opened.
        ctx.state = "OCCUPIED_SLEEPING";
      } else if (newDoorOpen) {
        ctx.state = "EXIT_PENDING";
      }
      break;

    case "OCCUPIED_SLEEPING":
      if (newPir) {
        ctx.state = "OCCUPIED_ACTIVE";
      } else if (newDoorOpen) {
        ctx.state = "EXIT_PENDING";
      }
      break;

    case "EXIT_PENDING":
      if (newDoorOpen) {
        // Door still open, wait for it to close
      } else {
        // Door closed. We need to see if there's still motion inside.
        if (newPir) {
          // Still someone inside
          ctx.state = "OCCUPIED_ACTIVE";
        } else if (secondsSinceDoor > config.vacancyTimeoutSeconds) {
          // Door closed, and no motion detected for the timeout period -> Confirmed Vacant
          ctx.state = "VACANT_CONFIRMED";
        }
      }
      break;
  }

  return ctx;
};
