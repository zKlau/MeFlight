import {
  CRUISE_SPEED_STORAGE_KEY,
  DEFAULT_CRUISE_SPEED_KTS,
  MAX_CRUISE_SPEED_KTS,
  MIN_CRUISE_SPEED_KTS,
} from "../consts/legs";

type SpeedListener = (speedKts: number) => void;

const listeners = new Set<SpeedListener>();

const clamp = (speedKts: number) => Math.min(MAX_CRUISE_SPEED_KTS, Math.max(MIN_CRUISE_SPEED_KTS, speedKts));

const readStored = () => {
  try {
    return Number(localStorage.getItem(CRUISE_SPEED_STORAGE_KEY));
  } catch {
    return 0;
  }
};

const store = (speedKts: number) => {
  try {
    localStorage.setItem(CRUISE_SPEED_STORAGE_KEY, String(speedKts));
  } catch {
    return;
  }
};

const initialSpeed = () => {
  const stored = readStored();

  if (!Number.isFinite(stored) || stored <= 0) {
    return DEFAULT_CRUISE_SPEED_KTS;
  }

  return clamp(stored);
};

let current = initialSpeed();

export const getCruiseSpeed = () => current;

export const setCruiseSpeed = (speedKts: number) => {
  if (!Number.isFinite(speedKts) || speedKts <= 0) {
    return;
  }

  current = clamp(speedKts);
  store(current);
  listeners.forEach((listener) => listener(current));
};

export const onCruiseSpeedChange = (listener: SpeedListener) => {
  listeners.add(listener);
};
