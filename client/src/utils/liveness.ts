import { LIVE_STALE_MS } from "../consts/map";
import type { AircraftTelemetry } from "../types";

export const isLiveTelemetryFresh = (telemetry: AircraftTelemetry) => {
  if (!telemetry.created_at) {
    return false;
  }

  return Date.now() - Date.parse(telemetry.created_at) < LIVE_STALE_MS;
};
