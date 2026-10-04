import type L from "leaflet";

export const AIRCRAFT_MARKER_Z_INDEX_OFFSET = 1000;
export const FIT_BOUNDS_PADDING_PX = 40;
export const FLIGHT_PANEL_POSITION: L.ControlPosition = "topright";

export const PANEL_ROLES = {
  follow: "follow",
  track: "track",
  plan: "plan",
  fit: "fit",
  stats: "stats",
};
