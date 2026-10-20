export const TILE_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
export const LABELS_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";
export const TILE_ATTRIBUTION = "&copy; Esri";
export const MAX_ZOOM = 18;
export const DEFAULT_VIEW = { center: [45, 10], zoom: 3 };
export const FIT_PADDING_PX = 30;

export const ROUTE_STYLE = { color: "#ffffff", weight: 3, opacity: 0.85, dashArray: "8 6" };
export const TOOLTIP_OPTIONS = { direction: "top", offset: [0, -8] };

export const MAP_TABS = { live: "live", edit: "edit" };
export const MAP_TAB_STORAGE_KEY = "meflight.recorder.mapTab";
export const ACTIVE_TAB_CLASS = "active";
