import L from "leaflet";
import type { TrackPoint } from "../types";

export const toLatLng = (point: TrackPoint) => L.latLng(point.lat, point.lon);

export const distanceBetween = (from: TrackPoint, to: TrackPoint) =>
  toLatLng(from).distanceTo(toLatLng(to));

export const timeBetweenMs = (from: TrackPoint, to: TrackPoint) =>
  Date.parse(to.timestamp) - Date.parse(from.timestamp);

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
