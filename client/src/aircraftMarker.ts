import L from "leaflet";
import {
  AIRCRAFT_MARKER_Z_INDEX_OFFSET,
  LIVE_OPACITY,
  PLANE_ICON_SIZE,
  PLANE_ICON_URL,
  ROTATION_ORIGIN,
  STALE_OPACITY,
} from "./consts/map";
import { isUnplacedPosition } from "./track/trackPoint";
import type { AircraftTelemetry } from "./types";
import { isLiveTelemetryFresh } from "./utils/liveness";
import { createWorldMarkers } from "./utils/worldCopies";


const opacityFor = (telemetry: AircraftTelemetry) => {
  if (isLiveTelemetryFresh(telemetry)) {
    return LIVE_OPACITY;
  }

  return STALE_OPACITY;
};

export const createAircraftMarker = (map: L.Map) => {
  const markers = createWorldMarkers(map, {
    icon: L.icon({ iconUrl: PLANE_ICON_URL, iconSize: PLANE_ICON_SIZE }),
    interactive: false,
    rotationAngle: 0,
    rotationOrigin: ROTATION_ORIGIN,
    zIndexOffset: AIRCRAFT_MARKER_Z_INDEX_OFFSET,
  });

  const update = (telemetry: AircraftTelemetry, longitude: number) => {
    if (isUnplacedPosition(telemetry)) {
      markers.hide();
      return;
    }

    markers.place([telemetry.LATITUDE, longitude]);
    markers.setRotation(telemetry.MAGNETIC_COMPASS);
    markers.setOpacity(opacityFor(telemetry));
    markers.show();
  };

  return { update };
};
