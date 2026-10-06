import { ONE_SECOND_MS } from "./time";

export const WIDGET_TYPES = {
  speed: "speed",
  altitude: "altitude",
  heading: "heading",
  fuel: "fuel",
  progress: "progress",
  distance: "distance",
  timeLeft: "time-left",
  next: "next",
  strip: "strip",
  map: "map",
  countries: "countries",
  countriesAll: "countries-all",
} as const;

export type WidgetType = (typeof WIDGET_TYPES)[keyof typeof WIDGET_TYPES];
export type CountriesWidgetType = typeof WIDGET_TYPES.countries | typeof WIDGET_TYPES.countriesAll;
export type ValueWidgetType = Exclude<WidgetType, typeof WIDGET_TYPES.strip | typeof WIDGET_TYPES.map | CountriesWidgetType>;

export const WIDGET_PARAMS = {
  type: "type",
  plan: "plan",
  panel: "panel",
  label: "label",
  zoom: "zoom",
};

export const PARAM_OFF = "0";
export const FOLLOW_LIVE_PLAN = "live";
export const WIDGET_PAGE = "widget.html";
export const WIDGET_PLAN_REFRESH_MS = 30 * ONE_SECOND_MS;
export const DEFAULT_MAP_ZOOM = 9;
export const MIN_MAP_ZOOM = 2;
export const MAX_MAP_ZOOM = 16;
export const MIN_GROUND_SPEED_FOR_ETE_KTS = 30;
export const SECONDS_PER_HOUR = 3600;
export const STALE_CLASS = "widget--stale";
export const PANEL_CLASS = "widget--panel";
export const COPIED_FEEDBACK_MS = 1500;
export const WIDE_WIDGET_MIN_WIDTH = 600;

export const WIDGET_TEXT = {
  empty: "–",
  unknownWidget: "Unknown widget. Open widgets.html to pick one.",
  noPlan: "No flight plan",
  speed: "Speed",
  altitude: "Altitude",
  heading: "Heading",
  fuel: "Fuel",
  progress: "Progress",
  distance: "Distance left",
  timeLeft: "Time left",
  next: "Next waypoint",
  groundSpeed: "GS",
  knots: "kts",
  feet: "ft",
  feetPerMinute: "fpm",
  nauticalMiles: "nm",
  degrees: "°",
  magnetic: "magnetic",
  gallons: "gal",
  to: "to",
  eta: "ETA",
  of: "of",
  copy: "Copy URL",
  copied: "Copied!",
  livePlan: "Plan I'm flying (live)",
  showPanel: "Background panel",
  showLabel: "Labels",
  size: "Recommended size",
  countries: "Countries",
  countriesAllTime: "Countries · all time",
  landed: "landed",
  flownOver: "flown over",
};

export type WidgetCatalogEntry = {
  type: WidgetType;
  title: string;
  description: string;
  width: number;
  height: number;
};

export const WIDGET_CATALOG: WidgetCatalogEntry[] = [
  { type: WIDGET_TYPES.strip, title: "Flight strip", description: "Speed, altitude, heading, fuel and progress in one row.", width: 900, height: 110 },
  { type: WIDGET_TYPES.map, title: "Mini map", description: "Follow-cam map with the plane, the flown track and the planned route.", width: 400, height: 300 },
  { type: WIDGET_TYPES.countries, title: "Countries visited", description: "Countries on the selected trip with their flags, split into landed and flown over.", width: 420, height: 150 },
  { type: WIDGET_TYPES.countriesAll, title: "Countries visited (all time)", description: "Every country across all your recorded flights.", width: 420, height: 150 },
  { type: WIDGET_TYPES.progress, title: "Progress", description: "Completion of the flight plan with a progress bar.", width: 340, height: 150 },
  { type: WIDGET_TYPES.timeLeft, title: "Time left", description: "Estimated time to the destination at the current ground speed, with ETA.", width: 300, height: 130 },
  { type: WIDGET_TYPES.distance, title: "Distance left", description: "Remaining distance along the planned route.", width: 300, height: 130 },
  { type: WIDGET_TYPES.next, title: "Next waypoint", description: "Next waypoint with distance and time to reach it.", width: 300, height: 130 },
  { type: WIDGET_TYPES.speed, title: "Speed", description: "Indicated airspeed and ground speed.", width: 260, height: 130 },
  { type: WIDGET_TYPES.altitude, title: "Altitude", description: "Altitude and vertical speed.", width: 260, height: 130 },
  { type: WIDGET_TYPES.heading, title: "Heading", description: "Magnetic heading.", width: 220, height: 130 },
  { type: WIDGET_TYPES.fuel, title: "Fuel", description: "Fuel remaining.", width: 220, height: 130 },
];
