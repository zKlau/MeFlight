import {
  DISTANCE_DECIMALS,
  FUEL_TANK_PREFIX,
  FUEL_TANK_SUFFIX,
  PERCENT,
  POSITION_DECIMALS,
  SECONDS_PER_HOUR,
  SECONDS_PER_MINUTE,
} from "./consts.js";

const EMPTY = "–";

export const orDash = (value) => {
  if (value === null || value === undefined) {
    return EMPTY;
  }

  return String(value);
};

export const orEmpty = (value) => {
  if (!value) {
    return "";
  }

  return String(value);
};

export const formatPercent = (fraction) => `${Math.round(fraction * PERCENT)}%`;

export const formatNm = (value) => `${value.toFixed(DISTANCE_DECIMALS)} nm`;

export const formatDateTime = (iso) => new Date(iso).toLocaleString();

export const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / SECONDS_PER_HOUR);
  const minutes = Math.floor((seconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  return `${hours}h ${minutes}m`;
};

export const formatPosition = (latitude, longitude) => {
  if (latitude === null || longitude === null) {
    return EMPTY;
  }

  return `${latitude.toFixed(POSITION_DECIMALS)}, ${longitude.toFixed(POSITION_DECIMALS)}`;
};

export const tankName = (simvar) =>
  simvar.replace(FUEL_TANK_PREFIX, "").replace(FUEL_TANK_SUFFIX, "").replaceAll("_", " ").toLowerCase();

export const planRoute = (plan) => `${orDash(plan.departure_id)} → ${orDash(plan.destination_id)}`;
