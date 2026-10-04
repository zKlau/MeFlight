export const STATUS_POLL_MS = 1000;
export const FREE_FLIGHT_VALUE = "";
export const PERCENT = 100;
export const DISTANCE_DECIMALS = 1;
export const POSITION_DECIMALS = 4;
export const SECONDS_PER_HOUR = 3600;
export const SECONDS_PER_MINUTE = 60;
export const FUEL_TANK_PREFIX = "FUEL_TANK_";
export const FUEL_TANK_SUFFIX = "_LEVEL";

export const ENDPOINTS = {
  status: "/api/status",
  plans: "/api/plans",
  upload: "/api/plans/upload",
  plan: (id) => `/api/plans/${id}`,
  resume: (id) => `/api/plans/${id}/resume`,
  restoreFuel: (id) => `/api/plans/${id}/restore-fuel`,
  startRecording: "/api/recording/start",
  stopRecording: "/api/recording/stop",
};

export const TEXT = {
  freeFlight: "Free flight (no plan)",
  simConnected: "MSFS: connected",
  simWaiting: "MSFS: waiting",
  recording: "● Recording",
  idle: "Idle",
  noPlans: "No flight plans uploaded yet.",
  select: "Select",
  delete: "Delete",
  confirmDelete: "Delete this flight plan? Everything recorded on it (track, progress, saved fuel) is deleted too. This cannot be undone.",
  chooseFile: "Choose a .PLN file first.",
  uploading: "Uploading…",
  uploaded: "Uploaded",
  noSavedState: "No position saved for this plan yet. Start at the departure airport.",
  freeFlightResume: "Free flights have no saved resume point.",
  restoring: "Setting fuel…",
  restored: "Fuel restored for",
  tanks: "tank(s).",
  onGround: "On ground",
  airborne: "Airborne",
  waypoints: "waypoints",
};

export const LABELS = {
  position: "Position",
  altitude: "Altitude",
  fuel: "Fuel",
  state: "State",
  pointsSent: "Points sent",
  lastSent: "Last sent",
  parkedNear: "Parked near",
  lastSeen: "Last seen",
  progress: "Progress",
  airportsVisited: "Airports visited",
  flightTime: "Flight time",
  feet: "ft",
};
