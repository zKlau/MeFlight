import { buildEndpoint } from "./apiService";
import { defaultAircraftTelemetry } from "./consts/aicraft";
import { ONE_SECOND_MS } from "./consts/time";
import type { AircraftTelemetry } from "./types";

let fetchInterval: ReturnType<typeof setInterval> | null = null;
let data: AircraftTelemetry = defaultAircraftTelemetry;


const startFetch = () => {
  if (fetchInterval) {
    clear()
  }

  fetchInterval = setInterval(async () => {
    const response = await fetch(buildEndpoint("live"));

    if (!response.ok) {
      throw new Error(
        `Request failed: ${response.status} ${response.statusText}`,
      );
    }

    data = await response.json();
  }, ONE_SECOND_MS);
};

const clear = () => {
  if (!fetchInterval) {
    return;
  }

  clearInterval(fetchInterval);
  data = defaultAircraftTelemetry;
  fetchInterval = null;
};


const getData = () => data;
const getPosition = () :  L.LatLngExpression => [data.LATITUDE,data.LONGITUDE]
const getRotation = () => data.MAGNETIC_COMPASS


export const flightData = {
  startFetch,
  clear,
  getData,
  getPosition,
  getRotation
};