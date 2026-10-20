import { FUEL_TEXT } from "../consts/fuel";
import { METERS_PER_NM } from "../consts/track";

type FuelRateListener = () => void;

const listeners = new Set<FuelRateListener>();
let gallonsPerNm = 0;

export const hasFuelRate = () => gallonsPerNm > 0;

export const setFuelPerNm = (rate: number) => {
  if (rate === gallonsPerNm) {
    return;
  }

  gallonsPerNm = rate;
  listeners.forEach((listener) => listener());
};

export const onFuelRateChange = (listener: FuelRateListener) => {
  listeners.add(listener);
};

export const fuelForMeters = (meters: number) => (meters / METERS_PER_NM) * gallonsPerNm;

export const formatFuel = (gallons: number) =>
  `${FUEL_TEXT.approximately}${Math.ceil(gallons).toLocaleString()} ${FUEL_TEXT.gallons}`;
