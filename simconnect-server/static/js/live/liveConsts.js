export const LIVE_PANEL_ID = "live-panel";
export const FOLLOW_STORAGE_KEY = "meflight.recorder.followAircraft";
export const FOLLOW_ZOOM = 8;
export const AIRCRAFT_Z_INDEX = 2000;
export const AIRCRAFT_SIZE = [32, 32];
export const AIRCRAFT_CLASS = "live-aircraft";
export const AIRCRAFT_ICON_CLASS = "live-aircraft__icon";
export const FOLLOW_ON = "true";
export const WAYPOINT_STYLE = { radius: 4, color: "#ffffff", weight: 2, fillColor: "#b84024", fillOpacity: 1 };

export const AIRCRAFT_SVG = `
  <svg class="${AIRCRAFT_ICON_CLASS}" viewBox="0 0 24 24" width="32" height="32" aria-hidden="true">
    <path d="M12 2c.8 0 1.4.7 1.4 1.6V9l7.6 4.4v2l-7.6-2.3v4.6l2.2 1.7V21L12 20l-3.6 1v-1.6l2.2-1.7v-4.6L3 15.4v-2L10.6 9V3.6C10.6 2.7 11.2 2 12 2z"/>
  </svg>
`;

export const LIVE_TEXT = {
  freeFlight: "Free flight: no route to show. Select a flight plan to see it here.",
  loading: "Loading route…",
  waitingForSim: "Waiting for an aircraft position from MSFS…",
  heading: "HDG",
  groundSpeed: "GS",
  knots: "kts",
  degrees: "°",
  separator: " · ",
};
