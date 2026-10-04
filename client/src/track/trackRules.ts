import { ENDPOINTS } from "../consts/endpoints";
import { MIN_POINT_DISTANCE_M, NEW_FLIGHT_GAP_MS } from "../consts/track";
import { isPlanSelection } from "../selection";
import type { AircraftTelemetry, TrackPoint, TrackResponse } from "../types";
import { distanceBetween, timeBetweenMs } from "../utils/geo";
import { flightPlanIdOf } from "./trackPoint";

export const trackEndpoint = (selection: string) => {
  if (isPlanSelection(selection)) {
    return ENDPOINTS.flightPlanTrack(selection);
  }

  return ENDPOINTS.track;
};

export const planIdFor = (selection: string, track: TrackResponse) => {
  if (isPlanSelection(selection)) {
    return selection;
  }

  return track.flightplan_id;
};

export const belongsToSelection = (telemetry: AircraftTelemetry, selection: string) => {
  if (!isPlanSelection(selection)) {
    return true;
  }

  return flightPlanIdOf(telemetry) === selection;
};

export const isAfterPause = (previous: TrackPoint | undefined, point: TrackPoint) => {
  if (!previous) {
    return false;
  }

  return timeBetweenMs(previous, point) > NEW_FLIGHT_GAP_MS;
};

export const isTooClose = (previous: TrackPoint | undefined, point: TrackPoint) => {
  if (!previous || point.new_segment) {
    return false;
  }

  return distanceBetween(previous, point) < MIN_POINT_DISTANCE_M;
};
