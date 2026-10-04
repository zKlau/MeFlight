import L from "leaflet";
import {
  PARKED_ICON_CLASS,
  PARKED_ICON_SIZE,
  PARKED_TOOLTIP_OPTIONS,
  PLANE_ICON_URL,
  ROTATION_ORIGIN,
} from "./consts/map";
import { SIDEBAR_TEXT } from "./consts/sidebar";
import type { LastState } from "./types";
import { createWorldMarkers } from "./utils/worldCopies";

const tooltipText = (state: LastState) => {
  if (!state.on_ground) {
    return SIDEBAR_TEXT.lastPosition;
  }

  if (!state.nearest_airport) {
    return SIDEBAR_TEXT.parkedHere;
  }

  return `${SIDEBAR_TEXT.parkedAt} ${state.nearest_airport.ident}`;
};

export const createParkedMarker = (map: L.Map) => {
  const markers = createWorldMarkers(map, {
    icon: L.icon({ iconUrl: PLANE_ICON_URL, iconSize: PARKED_ICON_SIZE, className: PARKED_ICON_CLASS }),
    rotationAngle: 0,
    rotationOrigin: ROTATION_ORIGIN,
  });

  const show = (state: LastState, longitude: number) => {
    markers.place([state.lat, longitude]);
    markers.setRotation(state.heading);
    markers.setTooltip(tooltipText(state), PARKED_TOOLTIP_OPTIONS);
    markers.show();
  };

  return { show, hide: markers.hide };
};
