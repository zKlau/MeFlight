import { fetchJson } from "./apiService";
import { ENDPOINTS } from "./consts/endpoints";
import { LOG_MESSAGES } from "./consts/messages";
import { defaultAircraftTelemetry } from "./consts/aicraft";
import { ONE_SECOND_MS } from "./consts/time";
import type { AircraftTelemetry } from "./types";

type Listener = (data: AircraftTelemetry) => void;

let fetchInterval: ReturnType<typeof setInterval> | null = null;
let data: AircraftTelemetry = defaultAircraftTelemetry;
const listeners = new Set<Listener>();


const fetchLatest = async () => {
  try {
    data = await fetchJson<AircraftTelemetry>(ENDPOINTS.live);
    listeners.forEach((listener) => listener(data));
  } catch (error) {
    console.warn(LOG_MESSAGES.liveFetchFailed, error);
  }
};

const startFetch = () => {
  if (fetchInterval) {
    clear();
  }

  fetchLatest();
  fetchInterval = setInterval(fetchLatest, ONE_SECOND_MS);
};

const clear = () => {
  if (!fetchInterval) {
    return;
  }

  clearInterval(fetchInterval);
  data = defaultAircraftTelemetry;
  fetchInterval = null;
};

const subscribe = (listener: Listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};


const getData = () => data;
const getPosition = () :  L.LatLngExpression => [data.LATITUDE,data.LONGITUDE]
const getRotation = () => data.MAGNETIC_COMPASS


export const flightData = {
  startFetch,
  clear,
  subscribe,
  getData,
  getPosition,
  getRotation,
};
