import type L from "leaflet";

export const AIRPORT_WAYPOINT_TYPE = "Airport";

export const PLAN_LINE_STYLE: L.PolylineOptions = {
  color: "#ffffff",
  weight: 2,
  opacity: 0.8,
  dashArray: "8 8",
  interactive: false,
};

export const WAYPOINT_MARKER_STYLE: L.CircleMarkerOptions = {
  radius: 3,
  color: "#ffffff",
  weight: 1,
  fillColor: "#ffffff",
  fillOpacity: 1,
};

export const AIRPORT_MARKER_STYLE: L.CircleMarkerOptions = {
  ...WAYPOINT_MARKER_STYLE,
  radius: 6,
  fillColor: "#ff4dd2",
};

export const WAYPOINT_TOOLTIP_OPTIONS: L.TooltipOptions = {
  direction: "top",
};
