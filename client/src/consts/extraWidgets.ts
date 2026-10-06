import { ONE_MINUTE_MS, ONE_SECOND_MS } from "./time";

export const LOCATION_REFRESH_MS = ONE_MINUTE_MS;
export const LOCATION_REFRESH_DISTANCE_M = 5000;
export const WEATHER_REFRESH_MS = 10 * ONE_MINUTE_MS;
export const WEATHER_AIRPORT_REFRESH_DISTANCE_M = 20_000;
export const LANDINGS_REFRESH_MS = 15 * ONE_SECOND_MS;
export const SESSION_REFRESH_MS = 30 * ONE_SECOND_MS;
export const SESSION_TICK_MS = ONE_SECOND_MS;
export const PROFILE_REFRESH_MS = ONE_MINUTE_MS;
export const PROFILE_MIN_DISTANCE_M = 200;
export const TRIP_COUNTRIES_REFRESH_MS = ONE_MINUTE_MS;
export const RECENT_STOPS_LIMIT = 5;
export const MS_PER_DAY = 86_400_000;

export const PHASES = {
  parked: "Parked",
  taxi: "Taxi",
  takeoff: "Takeoff",
  climb: "Climb",
  cruise: "Cruise",
  descent: "Descent",
  approach: "Approach",
  landed: "Landed",
} as const;

export type Phase = (typeof PHASES)[keyof typeof PHASES];

export const PHASE_LIMITS = {
  parkedMaxGroundSpeedKts: 3,
  taxiMaxGroundSpeedKts: 40,
  climbMinFpm: 300,
  descentMaxFpm: -300,
  takeoffWindowMs: ONE_MINUTE_MS,
  landedWindowMs: 2 * ONE_MINUTE_MS,
};

export const LANDING_RATINGS = [
  { maxFpm: 60, label: "Butter", tone: "good" },
  { maxFpm: 180, label: "Smooth", tone: "good" },
  { maxFpm: 300, label: "Firm", tone: "ok" },
  { maxFpm: 500, label: "Hard", tone: "bad" },
  { maxFpm: Infinity, label: "Ouch", tone: "bad" },
];

export const FLIGHT_CATEGORY_TONES: Record<string, string> = {
  VFR: "good",
  MVFR: "ok",
  IFR: "bad",
  LIFR: "bad",
};

export const EXTRA_TEXT = {
  nowOver: "Now over",
  overSea: "Over the sea",
  from: "from",
  currentLeg: "Current leg",
  left: "left",
  leg: "Leg",
  of: "of",
  phase: "Flight phase",
  lastLanding: "Last landing",
  best: "Best",
  landing: "landing",
  landings: "landings",
  noLandings: "No landings yet",
  tripDistance: "Flown",
  tripAirTime: "Air time",
  tripAirports: "Airports",
  tripCountries: "Countries",
  tripDay: "Day",
  autopilot: "AP",
  flightDirector: "FD",
  heading: "HDG",
  nav: "NAV",
  approach: "APR",
  altitude: "ALT",
  verticalSpeed: "VS",
  speed: "SPD",
  gear: "Gear",
  gearDown: "Down",
  gearUp: "Up",
  flaps: "Flaps",
  trim: "Trim",
  seatbelts: "Seatbelts",
  on: "On",
  off: "Off",
  recentStops: "Recent stops",
  noStops: "No stops yet",
  profile: "Altitude profile",
  max: "max",
  session: "Session",
  sessions: "sessions",
  airborne: "airborne",
  idle: "Not flying",
  weather: "Weather",
  calm: "Calm",
  variable: "VRB",
  gust: "G",
  noWeather: "No METAR nearby",
  celsius: "°C",
  hectopascal: "Q",
};
