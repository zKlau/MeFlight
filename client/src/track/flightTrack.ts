import L from "leaflet";
import { fetchJson } from "../apiService";
import { LOG_MESSAGES } from "../consts/messages";
import { isPlanSelection, LATEST_FLIGHT } from "../selection";
import type { AircraftTelemetry, TrackPoint, TrackResponse, TrackStats } from "../types";
import { alignLongitude } from "../utils/geo";
import { createFlightPlanLayer } from "./flightPlanLayer";
import { createTrackLine } from "./trackLine";
import { belongsToSelection, isAfterPause, isTooClose, planIdFor, trackEndpoint } from "./trackRules";
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
  let selection = LATEST_FLIGHT;
  let loaded = false;
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
  };

  const show = async (nextSelection: string) => {
    selection = nextSelection;
    loaded = false;
    lastTelemetryTimestamp = undefined;
    trackLine.clear();

    try {
      const track = await fetchJson<TrackResponse>(trackEndpoint(nextSelection));

      if (nextSelection !== selection) {
        return;
      }

      drawTrack(track);
      await flightPlan.show(planIdFor(nextSelection, track));
    } catch (error) {
      console.warn(LOG_MESSAGES.trackFetchFailed, error);
    } finally {
      loaded = true;
    }
  };

  const followLivePlan = (telemetry: AircraftTelemetry) => {
    if (!isPlanSelection(selection)) {
      flightPlan.show(flightPlanIdOf(telemetry));
    }
  };

  const prepareSegment = (point: TrackPoint) => {
    if (!isAfterPause(trackLine.lastPoint(), point)) {
      return;
    }

    if (isPlanSelection(selection)) {
      point.new_segment = true;
      return;
    }

    trackLine.clear();
  };

  const addLivePoint = (telemetry: AircraftTelemetry) => {
    if (!loaded || !belongsToSelection(telemetry, selection)) {
      return;
    }

    followLivePlan(telemetry);

    if (!isNewTelemetry(telemetry)) {
      return;
    }

    lastTelemetryTimestamp = telemetry.created_at;

    if (isUnplacedPosition(telemetry)) {
      return;
    }

    const point = telemetryToTrackPoint(telemetry);
    prepareSegment(point);

    if (isTooClose(trackLine.lastPoint(), point)) {
      return;
    }

    trackLine.add(point);
    notifyStatsChange();
  };

  const alignToTrack = (longitude: number) => {
    const previous = trackLine.lastPoint();

    if (!previous) {
      return longitude;
    }

    return alignLongitude(longitude, previous.lon);
  };

  const getBounds = () => trackLine.getBounds().extend(flightPlan.getBounds());

  const getTrackBounds = () => trackLine.getBounds();

  return {
    show,
    addLivePoint,
    alignToTrack,
    getBounds,
    getTrackBounds,
    onStatsChange,
    markVisited: flightPlan.markVisited,
    trackLayer: trackLine.layer,
    planLayer: flightPlan.layer,
  };
};

export type FlightTrack = ReturnType<typeof createFlightTrack>;
