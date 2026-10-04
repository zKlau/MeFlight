import L from "leaflet";
import type { TrackPoint } from "../types";

export const toLatLng = (point: TrackPoint) => L.latLng(point.lat, point.lon);

export const distanceBetween = (from: TrackPoint, to: TrackPoint) =>
  toLatLng(from).distanceTo(toLatLng(to));

export const timeBetweenMs = (from: TrackPoint, to: TrackPoint) =>
  Date.parse(to.timestamp) - Date.parse(from.timestamp);

const HALF_CIRCLE_DEGREES = 180;
const FULL_CIRCLE_DEGREES = 360;

export const alignLongitude = (longitude: number, reference: number) => {
  let aligned = longitude;

  while (aligned - reference > HALF_CIRCLE_DEGREES) {
    aligned -= FULL_CIRCLE_DEGREES;
  }

  while (reference - aligned > HALF_CIRCLE_DEGREES) {
    aligned += FULL_CIRCLE_DEGREES;
  }

  return aligned;
};

export const unwrapLongitudes = (coordinates: [number, number][]) => {
  const unwrapped: [number, number][] = [];

  for (const [latitude, longitude] of coordinates) {
    const previous = unwrapped.at(-1);

    if (!previous) {
      unwrapped.push([latitude, longitude]);
      continue;
    }

    unwrapped.push([latitude, alignLongitude(longitude, previous[1])]);
  }

  return unwrapped;
};

export const findNearestPoint = (points: TrackPoint[], target: L.LatLng) => {
  let nearest = points[0];
  let nearestDistance = Infinity;

  for (const point of points) {
    const distance = toLatLng(point).distanceTo(target);
    if (distance < nearestDistance) {
      nearest = point;
      nearestDistance = distance;
    }
  }

  return nearest;
};
