export const EDITOR_ENDPOINTS = {
  plan: (id) => `/api/plans/${id}`,
  waypoints: (id) => `/api/plans/${id}/waypoints`,
  airport: (ident) => `/api/airports/${encodeURIComponent(ident)}`,
};

export const WAYPOINT_TYPES = ["Airport", "Intersection", "VOR", "NDB", "User"];
export const AIRPORT_TYPE = "Airport";
export const USER_TYPE = "User";
export const NEW_WAYPOINT_PREFIX = "WPT";
export const MIN_WAYPOINTS = 2;
export const COORDINATE_DECIMALS = 5;
export const HALF_CIRCLE_DEGREES = 180;
export const FULL_CIRCLE_DEGREES = 360;
export const NEW_POINT_OFFSET_DEGREES = 0.2;
export const SEGMENT_HIT_TOLERANCE_PX = 12;

export const TILE_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
export const LABELS_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";
export const TILE_ATTRIBUTION = "&copy; Esri";
export const MAX_ZOOM = 18;
export const DEFAULT_VIEW = { center: [45, 10], zoom: 3 };
export const FIT_PADDING_PX = 30;

export const ROUTE_STYLE = { color: "#ffffff", weight: 3, opacity: 0.85, dashArray: "8 6" };
export const TOOLTIP_OPTIONS = { direction: "top", offset: [0, -8] };

export const EDITOR_TEXT = {
  noPlan: "Select a flight plan to edit its route.",
  hint: "Drag a point to move it, click the route line to insert a point, or click a point to edit it.",
  addMode: "Click on the map to add a point after the selected one.",
  unsaved: "Unsaved changes",
  saved: "Route saved.",
  saving: "Saving…",
  loading: "Loading route…",
  confirmDiscard: "Discard your unsaved route changes?",
  confirmLeave: "You have unsaved route changes. Switch plan and lose them?",
  tooFew: "A route needs at least two points.",
  airportNotFound: "Airport not found.",
  noSelection: "Select a point on the map or in the list.",
  identifier: "Identifier",
  type: "Type",
  latitude: "Latitude",
  longitude: "Longitude",
  altitude: "Altitude (ft)",
  lookUp: "Look up airport",
  moveUp: "Move up",
  moveDown: "Move down",
  addAfter: "Add point after",
  remove: "Delete point",
  addOnMap: "Add point on map",
  cancelAdd: "Cancel adding",
};
