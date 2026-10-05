import type L from "leaflet";
import { ONE_SECOND_MS } from "./time";

export const AIRCRAFT_MARKER_Z_INDEX_OFFSET = 1000;
export const FIT_BOUNDS_PADDING_PX = 40;
export const FLIGHT_PANEL_POSITION: L.ControlPosition = "topright";

export const PLANE_ICON_URL = "/plane.png";
export const PLANE_ICON_SIZE: L.PointExpression = [64, 64];
export const PARKED_ICON_SIZE: L.PointExpression = [48, 48];
export const PARKED_ICON_CLASS = "parked-aircraft";
export const ROTATION_ORIGIN = "center";

export const LIVE_STALE_MS = 30 * ONE_SECOND_MS;
export const LIVE_OPACITY = 1;
export const STALE_OPACITY = 0.45;

export const PARKED_TOOLTIP_OPTIONS: L.TooltipOptions = {
  permanent: true,
  direction: "bottom",
  offset: [0, 20],
  className: "parked-tooltip",
};

export const PANEL_ROLES = {
  follow: "follow",
  track: "track",
  plan: "plan",
  places: "places",
  collapse: "collapse",
  fit: "fit",
  stats: "stats",
};
