import L from "leaflet";
import { HALF_TURN_DEGREES, METERS_PER_KM, UPRIGHT_LIMIT_DEGREES } from "../consts/legs";
import { UI_TEXT } from "../consts/messages";
import { MINUTES_PER_HOUR, SECONDS_PER_MINUTE } from "../consts/time";
import { METERS_PER_NM } from "../consts/track";

const SECONDS_PER_HOUR = 3600;
const RADIANS_TO_DEGREES = 180 / Math.PI;
const PROJECTION_ZOOM = 0;

export type LegPosition = [number, number];

export const legDistanceM = (start: LegPosition, end: LegPosition) => L.latLng(start).distanceTo(L.latLng(end));

export const secondsAtSpeed = (meters: number, speedKts: number) => (meters / METERS_PER_NM / speedKts) * SECONDS_PER_HOUR;

export const formatLegDistance = (meters: number, nauticalMilesUnit: string, kilometersUnit: string) =>
  `${Math.round(meters / METERS_PER_NM).toLocaleString()} ${nauticalMilesUnit} · ${Math.round(meters / METERS_PER_KM).toLocaleString()} ${kilometersUnit}`;

const MINUTE_DIGITS = 2;

export const formatLegTime = (seconds: number) => {
  const totalMinutes = Math.round(seconds / SECONDS_PER_MINUTE);
  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
  const minutes = totalMinutes % MINUTES_PER_HOUR;

  if (hours === 0) {
    return `${minutes}${UI_TEXT.minutesUnit}`;
  }

  return `${hours}${UI_TEXT.hoursUnit} ${String(minutes).padStart(MINUTE_DIGITS, "0")}${UI_TEXT.minutesUnit}`;
};

export const uprightAngle = (start: LegPosition, end: LegPosition) => {
  const a = L.CRS.EPSG3857.latLngToPoint(L.latLng(start), PROJECTION_ZOOM);
  const b = L.CRS.EPSG3857.latLngToPoint(L.latLng(end), PROJECTION_ZOOM);
  const angle = Math.atan2(b.y - a.y, b.x - a.x) * RADIANS_TO_DEGREES;

  if (angle > UPRIGHT_LIMIT_DEGREES) {
    return angle - HALF_TURN_DEGREES;
  }

  if (angle < -UPRIGHT_LIMIT_DEGREES) {
    return angle + HALF_TURN_DEGREES;
  }

  return angle;
};

export const midpoint = (start: LegPosition, end: LegPosition): LegPosition => [
  (start[0] + end[0]) / 2,
  (start[1] + end[1]) / 2,
];
