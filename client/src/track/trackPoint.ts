import { MISSING_COORDINATE } from "../consts/track";
import type { AircraftTelemetry, TrackPoint } from "../types";
import { parseAltitude } from "../utils/format";

export type TimestampedTelemetry = AircraftTelemetry & { created_at: string };

export const isUnplacedPosition = (telemetry: AircraftTelemetry) =>
  telemetry.LATITUDE === MISSING_COORDINATE || telemetry.LONGITUDE === MISSING_COORDINATE;

export const telemetryToTrackPoint = (telemetry: TimestampedTelemetry): TrackPoint => ({
  lat: telemetry.LATITUDE,
  lon: telemetry.LONGITUDE,
  altitude: parseAltitude(telemetry.ALTITUDE),
  airspeed: telemetry.AIRSPEED_INDICATE,
  heading: telemetry.MAGNETIC_COMPASS,
  on_ground: Boolean(telemetry.SIM_ON_GROUND),
  new_segment: false,
  timestamp: telemetry.created_at,
});

export const flightPlanIdOf = (telemetry: AircraftTelemetry) => {
  if (!telemetry.FLIGHTPLAN_ID) {
    return null;
  }

  return telemetry.FLIGHTPLAN_ID;
};
