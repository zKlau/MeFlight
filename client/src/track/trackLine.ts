import L from "leaflet";
import {
  ALTITUDE_BANDS,
  METERS_PER_NM,
  TRACK_CLICK_TOLERANCE_PX,
  TRACK_LINE_STYLE,
} from "../consts/track";
import type { TrackPoint, TrackStats } from "../types";
import { alignLongitude, distanceBetween, timeBetweenMs, toLatLng } from "../utils/geo";
import { shiftPosition, WORLD_COPY_OFFSETS } from "../utils/worldCopies";
import { showNearestPointPopup } from "./trackPopup";

type Segment = {
  band: number;
  lines: L.Polyline[];
  points: TrackPoint[];
};

const toPosition = (point: TrackPoint, offset: number) => shiftPosition([point.lat, point.lon], offset);

const altitudeBandIndex = (altitudeFt: number) =>
  ALTITUDE_BANDS.findIndex((band) => altitudeFt < band.maxFt);

export const createTrackLine = (map: L.Map) => {
  const renderer = L.canvas({ tolerance: TRACK_CLICK_TOLERANCE_PX });
  const layer = L.featureGroup().addTo(map);

  let points: TrackPoint[] = [];
  let distanceM = 0;
  let elapsedMs = 0;
  let currentSegment: Segment | null = null;

  const lastPoint = () => points.at(-1);

  const connectsToPrevious = (point: TrackPoint) => Boolean(lastPoint()) && !point.new_segment;

  const segmentStartPoints = (point: TrackPoint) => {
    const previous = lastPoint();

    if (!previous || !connectsToPrevious(point)) {
      return [point];
    }

    return [previous, point];
  };

  const createLine = (band: number, segmentPoints: TrackPoint[], offset: number) => {
    const line = L.polyline(segmentPoints.map((point) => toPosition(point, offset)), {
      ...TRACK_LINE_STYLE,
      color: ALTITUDE_BANDS[band].color,
      renderer,
    });

    line.on("click", (event) => showNearestPointPopup(map, segmentPoints, event, offset));
    return line.addTo(layer);
  };

  const startSegment = (band: number, point: TrackPoint) => {
    const segmentPoints = segmentStartPoints(point);
    const lines = WORLD_COPY_OFFSETS.map((offset) => createLine(band, segmentPoints, offset));
    currentSegment = { band, lines, points: segmentPoints };
  };

  const extendSegment = (segment: Segment, point: TrackPoint) => {
    segment.points.push(point);
    segment.lines.forEach((line, index) => line.addLatLng(toPosition(point, WORLD_COPY_OFFSETS[index])));
  };

  const addMetricsTo = (point: TrackPoint) => {
    const previous = lastPoint();

    if (previous && connectsToPrevious(point)) {
      distanceM += distanceBetween(previous, point);
      elapsedMs += timeBetweenMs(previous, point);
    }
  };

  const alignedWithPrevious = (point: TrackPoint): TrackPoint => {
    const previous = lastPoint();

    if (!previous) {
      return point;
    }

    return { ...point, lon: alignLongitude(point.lon, previous.lon) };
  };

  const continuesSegment = (segment: Segment | null, band: number, point: TrackPoint): segment is Segment =>
    segment !== null && segment.band === band && !point.new_segment;

  const add = (rawPoint: TrackPoint) => {
    const point = alignedWithPrevious(rawPoint);
    const band = altitudeBandIndex(point.altitude);

    if (continuesSegment(currentSegment, band, point)) {
      extendSegment(currentSegment, point);
    } else {
      startSegment(band, point);
    }

    addMetricsTo(point);
    points.push(point);
  };

  const clear = () => {
    layer.clearLayers();
    points = [];
    distanceM = 0;
    elapsedMs = 0;
    currentSegment = null;
  };

  const getStats = (): TrackStats => ({
    distanceNm: distanceM / METERS_PER_NM,
    durationMs: elapsedMs,
    points: points.length,
  });

  const getBounds = () => L.latLngBounds(points.map(toLatLng));

  return { layer, add, clear, lastPoint, getStats, getBounds };
};
