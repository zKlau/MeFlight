import { FULL_CIRCLE_DEGREES, HALF_CIRCLE_DEGREES } from "./editorConsts.js";

export const alignLongitude = (longitude, reference) => {
  let aligned = longitude;

  while (aligned - reference > HALF_CIRCLE_DEGREES) {
    aligned -= FULL_CIRCLE_DEGREES;
  }

  while (reference - aligned > HALF_CIRCLE_DEGREES) {
    aligned += FULL_CIRCLE_DEGREES;
  }

  return aligned;
};

export const displayPositions = (waypoints) => {
  const positions = [];

  for (const waypoint of waypoints) {
    const previous = positions.at(-1);

    if (!previous) {
      positions.push([waypoint.latitude, waypoint.longitude]);
      continue;
    }

    positions.push([waypoint.latitude, alignLongitude(waypoint.longitude, previous[1])]);
  }

  return positions;
};

export const normalizeLongitude = (longitude) =>
  ((((longitude + HALF_CIRCLE_DEGREES) % FULL_CIRCLE_DEGREES) + FULL_CIRCLE_DEGREES) % FULL_CIRCLE_DEGREES) - HALF_CIRCLE_DEGREES;
