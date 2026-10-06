import L from "leaflet";
import { fetchJson } from "../../apiService";
import { ENDPOINTS } from "../../consts/endpoints";
import { LOG_MESSAGES } from "../../consts/messages";
import { isUnplacedPosition } from "../../track/trackPoint";
import type { AircraftTelemetry } from "../../types";

export const startPolling = (task: () => void, intervalMs: number) => {
  task();
  setInterval(task, intervalMs);
};

export const livePosition = (live: AircraftTelemetry) => {
  if (isUnplacedPosition(live)) {
    return null;
  }

  return L.latLng(live.LATITUDE, live.LONGITUDE);
};

export const createPositionThrottle = (minDistanceM: number, maxAgeMs: number) => {
  let lastPosition: L.LatLng | null = null;
  let lastAt = 0;

  return (position: L.LatLng) => {
    const due = lastPosition === null || Date.now() - lastAt > maxAgeMs || lastPosition.distanceTo(position) > minDistanceM;

    if (due) {
      lastPosition = position;
      lastAt = Date.now();
    }

    return due;
  };
};

export const fetchQuietly = async <T>(path: string): Promise<T | null> => {
  try {
    return await fetchJson<T>(path);
  } catch (error) {
    console.warn(LOG_MESSAGES.widgetFetchFailed, error);
    return null;
  }
};

const airportNameCache = new Map<string, string>();

export const loadAirportNames = async (idents: string[]) => {
  const missing = idents.filter((ident) => !airportNameCache.has(ident));

  if (missing.length === 0) {
    return airportNameCache;
  }

  const names = await fetchQuietly<Record<string, string>>(ENDPOINTS.airportNames(missing));

  if (names) {
    Object.entries(names).forEach(([ident, name]) => airportNameCache.set(ident, name));
  }

  return airportNameCache;
};
