import L from "leaflet";
import { METERS_PER_NM } from "../consts/track";
import { MIN_GROUND_SPEED_FOR_ETE_KTS, SECONDS_PER_HOUR } from "../consts/widgets";
import { isUnplacedPosition } from "../track/trackPoint";
import type { AircraftTelemetry, FlightPlanRoutePoint } from "../types";
import type { WidgetContext } from "./dataFeed";

export type RouteMetrics = {
  next: FlightPlanRoutePoint;
  destination: FlightPlanRoutePoint;
  distanceToNextM: number;
  remainingM: number;
};

const toLatLng = (waypoint: FlightPlanRoutePoint) => L.latLng(waypoint.latitude, waypoint.longitude);

const remainingAfter = (points: FlightPlanRoutePoint[], fromIndex: number) => {
  let total = 0;

  for (let index = fromIndex; index < points.length - 1; index += 1) {
    total += toLatLng(points[index]).distanceTo(toLatLng(points[index + 1]));
  }

  return total;
};

const hasPosition = (live: AircraftTelemetry | null): live is AircraftTelemetry =>
  live !== null && !isUnplacedPosition(live);

export const routeMetrics = (context: WidgetContext): RouteMetrics | null => {
  const { live, progress, route } = context;

  if (!hasPosition(live) || !progress || !route || route.points.length === 0) {
    return null;
  }

  const lastIndex = route.points.length - 1;
  const nextIndex = Math.min(progress.current_leg_index + 1, lastIndex);
  const next = route.points[nextIndex];
  const distanceToNextM = L.latLng(live.LATITUDE, live.LONGITUDE).distanceTo(toLatLng(next));

  return {
    next,
    destination: route.points[lastIndex],
    distanceToNextM,
    remainingM: distanceToNextM + remainingAfter(route.points, nextIndex),
  };
};

export const groundSpeedKts = (live: AircraftTelemetry | null) => {
  if (!live || !live.GROUND_VELOCITY) {
    return 0;
  }

  return live.GROUND_VELOCITY;
};

export const secondsToCover = (meters: number, speedKts: number) => {
  if (speedKts < MIN_GROUND_SPEED_FOR_ETE_KTS) {
    return null;
  }

  return meters / ((speedKts * METERS_PER_NM) / SECONDS_PER_HOUR);
};

export const metersToNm = (meters: number) => meters / METERS_PER_NM;
