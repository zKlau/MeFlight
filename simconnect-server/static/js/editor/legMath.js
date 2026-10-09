import { LEG_TEXT, METERS_PER_KM, METERS_PER_NM } from "./editorConsts.js";

const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const MINUTE_DIGITS = 2;
const RADIANS_TO_DEGREES = 180 / Math.PI;
const UPRIGHT_LIMIT_DEGREES = 90;
const HALF_TURN_DEGREES = 180;
const PROJECTION_ZOOM = 0;

export const legDistanceM = (start, end) => L.latLng(start).distanceTo(L.latLng(end));

export const routeDistanceM = (positions) => {
  let total = 0;

  for (let index = 0; index < positions.length - 1; index += 1) {
    total += legDistanceM(positions[index], positions[index + 1]);
  }

  return total;
};

export const secondsAtSpeed = (meters, speedKts) => (meters / METERS_PER_NM / speedKts) * SECONDS_PER_HOUR;

export const formatDistance = (meters) =>
  `${Math.round(meters / METERS_PER_NM).toLocaleString()} ${LEG_TEXT.nauticalMiles} · ${Math.round(meters / METERS_PER_KM).toLocaleString()} ${LEG_TEXT.kilometers}`;

export const formatTime = (seconds) => {
  const totalMinutes = Math.round(seconds / SECONDS_PER_MINUTE);
  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
  const minutes = totalMinutes % MINUTES_PER_HOUR;

  if (hours === 0) {
    return `${minutes}${LEG_TEXT.minutes}`;
  }

  return `${hours}${LEG_TEXT.hours} ${String(minutes).padStart(MINUTE_DIGITS, "0")}${LEG_TEXT.minutes}`;
};

export const uprightAngle = (start, end) => {
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

export const midpoint = (start, end) => [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
