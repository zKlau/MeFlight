import type L from "leaflet";
import { ONE_MINUTE_MS } from "./time";

export const NEW_FLIGHT_GAP_MINUTES = 10;
export const NEW_FLIGHT_GAP_MS = NEW_FLIGHT_GAP_MINUTES * ONE_MINUTE_MS;
export const MIN_POINT_DISTANCE_M = 25;
export const METERS_PER_NM = 1852;
export const DISTANCE_DECIMALS = 1;
export const THOUSANDS_SEPARATOR = ",";

export const UNPLACED_POSITION = { latitude: 0, longitude: 0 };

export const TRACK_CLICK_TOLERANCE_PX = 8;

export const TRACK_LINE_STYLE: L.PolylineOptions = {
  weight: 4,
  opacity: 0.9,
};

export const ALTITUDE_BANDS = [
  { maxFt: 1_000, color: "#ff4d4d", label: "< 1,000 ft" },
  { maxFt: 5_000, color: "#ff9f1c", label: "1,000 – 5,000 ft" },
  { maxFt: 10_000, color: "#ffe14d", label: "5,000 – 10,000 ft" },
  { maxFt: 20_000, color: "#7bed5f", label: "10,000 – 20,000 ft" },
  { maxFt: 30_000, color: "#38d9f5", label: "20,000 – 30,000 ft" },
  { maxFt: Infinity, color: "#c792ff", label: "> 30,000 ft" },
];
