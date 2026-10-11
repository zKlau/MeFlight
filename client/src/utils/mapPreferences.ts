import { MAP_PREFERENCES_STORAGE_KEY } from "../consts/map";

type MapPreferences = Record<string, boolean>;

const isPreferences = (value: unknown): value is MapPreferences =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readAll = (): MapPreferences => {
  try {
    const stored = localStorage.getItem(MAP_PREFERENCES_STORAGE_KEY);

    if (!stored) {
      return {};
    }

    const parsed: unknown = JSON.parse(stored);

    if (!isPreferences(parsed)) {
      return {};
    }

    return parsed;
  } catch {
    return {};
  }
};

const preferences = readAll();

export const getPreference = (key: string, fallback: boolean) => {
  const value = preferences[key];

  if (typeof value !== "boolean") {
    return fallback;
  }

  return value;
};

export const setPreference = (key: string, value: boolean) => {
  preferences[key] = value;

  try {
    localStorage.setItem(MAP_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    return;
  }
};
