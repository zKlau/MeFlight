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
  location: "location",
  leg: "leg",
  phase: "phase",
  trip: "trip",
  autopilot: "autopilot",
  config: "config",
  log: "log",
  profile: "profile",
  overview: "overview",
  landing: "landing",
  session: "session",
  weather: "weather",
} as const;

export type WidgetType = (typeof WIDGET_TYPES)[keyof typeof WIDGET_TYPES];
export type CountriesWidgetType = typeof WIDGET_TYPES.countries | typeof WIDGET_TYPES.countriesAll;
export type ExtraWidgetType =
  | typeof WIDGET_TYPES.location
  | typeof WIDGET_TYPES.leg
  | typeof WIDGET_TYPES.phase
  | typeof WIDGET_TYPES.trip
  | typeof WIDGET_TYPES.autopilot
  | typeof WIDGET_TYPES.config
  | typeof WIDGET_TYPES.log
  | typeof WIDGET_TYPES.profile
  | typeof WIDGET_TYPES.overview
  | typeof WIDGET_TYPES.landing
  | typeof WIDGET_TYPES.session
  | typeof WIDGET_TYPES.weather;
export type ValueWidgetType = Exclude<WidgetType, typeof WIDGET_TYPES.strip | typeof WIDGET_TYPES.map | CountriesWidgetType | ExtraWidgetType>;

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
