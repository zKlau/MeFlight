import L from "leaflet";
import { fetchJson } from "../apiService";
import { ENDPOINTS } from "../consts/endpoints";
import { LOG_MESSAGES } from "../consts/messages";
import { MIN_POINT_DISTANCE_M, NEW_FLIGHT_GAP_MS } from "../consts/track";
import type { AircraftTelemetry, TrackPoint, TrackResponse, TrackStats } from "../types";
import { distanceBetween, timeBetweenMs } from "../utils/geo";
import { createFlightPlanLayer } from "./flightPlanLayer";
import { createTrackLine } from "./trackLine";
import {
  flightPlanIdOf,
  isUnplacedPosition,
  telemetryToTrackPoint,
  type TimestampedTelemetry,
} from "./trackPoint";

type StatsListener = (stats: TrackStats) => void;

export const createFlightTrack = (map: L.Map) => {
  const trackLine = createTrackLine(map);
  const flightPlan = createFlightPlanLayer(map);
  const statsListeners = new Set<StatsListener>();
  let lastTelemetryTimestamp: string | undefined;

  const notifyStatsChange = () => {
    const stats = trackLine.getStats();
    statsListeners.forEach((listener) => listener(stats));
  };

  const onStatsChange = (listener: StatsListener) => {
    statsListeners.add(listener);
  };

  const isNewTelemetry = (telemetry: AircraftTelemetry): telemetry is TimestampedTelemetry =>
    Boolean(telemetry.created_at) && telemetry.created_at !== lastTelemetryTimestamp;

  const startsNewFlight = (point: TrackPoint) => {
    const previous = trackLine.lastPoint();

    if (!previous) {
      return false;
    }

    return timeBetweenMs(previous, point) > NEW_FLIGHT_GAP_MS;
  };

  const isTooCloseToLastPoint = (point: TrackPoint) => {
    const previous = trackLine.lastPoint();

    if (!previous) {
      return false;
    }

    return distanceBetween(previous, point) < MIN_POINT_DISTANCE_M;
  };

  const rememberLastTimestamp = (track: TrackResponse) => {
    const lastPoint = track.points.at(-1);

    if (lastPoint) {
      lastTelemetryTimestamp = lastPoint.timestamp;
    }
  };

  const drawTrack = (track: TrackResponse) => {
    trackLine.clear();
    track.points.forEach(trackLine.add);
    rememberLastTimestamp(track);
    notifyStatsChange();
    flightPlan.show(track.flightplan_id);
  };

  const load = async () => {
    try {
      drawTrack(await fetchJson<TrackResponse>(ENDPOINTS.track));
    } catch (error) {
      console.warn(LOG_MESSAGES.trackFetchFailed, error);
    }
  };

  const addLivePoint = (telemetry: AircraftTelemetry) => {
    flightPlan.show(flightPlanIdOf(telemetry));

    if (!isNewTelemetry(telemetry)) {
      return;
    }

    lastTelemetryTimestamp = telemetry.created_at;

    if (isUnplacedPosition(telemetry)) {
      return;
    }

    const point = telemetryToTrackPoint(telemetry);

    if (startsNewFlight(point)) {
      trackLine.clear();
    }

    if (isTooCloseToLastPoint(point)) {
      return;
    }

    trackLine.add(point);
    notifyStatsChange();
  };

  const getBounds = () => {
    const bounds = L.latLngBounds([]);

    for (const layer of [trackLine.layer, flightPlan.layer]) {
      if (layer.getLayers().length > 0) {
        bounds.extend(layer.getBounds());
      }
    }

    return bounds;
  };

  return {
    load,
    addLivePoint,
    getBounds,
    onStatsChange,
    trackLayer: trackLine.layer,
    planLayer: flightPlan.layer,
  };
};

export type FlightTrack = ReturnType<typeof createFlightTrack>;
