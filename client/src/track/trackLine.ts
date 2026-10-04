import L from "leaflet";
import {
  ALTITUDE_BANDS,
  METERS_PER_NM,
  TRACK_CLICK_TOLERANCE_PX,
  TRACK_LINE_STYLE,
} from "../consts/track";
import type { TrackPoint, TrackStats } from "../types";
import { distanceBetween, timeBetweenMs, toLatLng } from "../utils/geo";
import { showNearestPointPopup } from "./trackPopup";

type Segment = {
  band: number;
  line: L.Polyline;
  points: TrackPoint[];
};

const altitudeBandIndex = (altitudeFt: number) =>
  ALTITUDE_BANDS.findIndex((band) => altitudeFt < band.maxFt);

export const createTrackLine = (map: L.Map) => {
  const renderer = L.canvas({ tolerance: TRACK_CLICK_TOLERANCE_PX });
  const layer = L.featureGroup().addTo(map);

  let points: TrackPoint[] = [];
  let distanceM = 0;
  let currentSegment: Segment | null = null;

  const lastPoint = () => points.at(-1);

  const segmentStartPoints = (point: TrackPoint) => {
    const previous = lastPoint();

    if (!previous) {
      return [point];
    }

    return [previous, point];
  };

  const startSegment = (band: number, point: TrackPoint) => {
    const segmentPoints = segmentStartPoints(point);
    const line = L.polyline(segmentPoints.map(toLatLng), {
      ...TRACK_LINE_STYLE,
      color: ALTITUDE_BANDS[band].color,
      renderer,
    });

    line.on("click", (event) => showNearestPointPopup(map, segmentPoints, event));
    line.addTo(layer);
    currentSegment = { band, line, points: segmentPoints };
  };

  const extendSegment = (segment: Segment, point: TrackPoint) => {
    segment.points.push(point);
    segment.line.addLatLng(toLatLng(point));
  };

  const addDistanceTo = (point: TrackPoint) => {
    const previous = lastPoint();

    if (previous) {
      distanceM += distanceBetween(previous, point);
    }
  };

  const add = (point: TrackPoint) => {
    const band = altitudeBandIndex(point.altitude);

    if (currentSegment && currentSegment.band === band) {
      extendSegment(currentSegment, point);
    } else {
      startSegment(band, point);
    }

    addDistanceTo(point);
    points.push(point);
  };

  const clear = () => {
    layer.clearLayers();
    points = [];
    distanceM = 0;
    currentSegment = null;
  };

  const durationMs = () => {
    const first = points.at(0);
    const last = lastPoint();

    if (!first || !last) {
      return 0;
    }

    return timeBetweenMs(first, last);
  };

  const getStats = (): TrackStats => ({
    distanceNm: distanceM / METERS_PER_NM,
    durationMs: durationMs(),
    points: points.length,
  });

  return { layer, add, clear, lastPoint, getStats };
};
