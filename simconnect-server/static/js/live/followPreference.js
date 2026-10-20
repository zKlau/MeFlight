import { FOLLOW_ON, FOLLOW_STORAGE_KEY } from "./liveConsts.js";

export const readFollow = () => {
  try {
    const stored = localStorage.getItem(FOLLOW_STORAGE_KEY);

    if (stored === null) {
      return true;
    }

    return stored === FOLLOW_ON;
  } catch {
    return true;
  }
};

export const storeFollow = (follow) => {
  try {
    localStorage.setItem(FOLLOW_STORAGE_KEY, String(follow));
  } catch {
    return;
  }
};
