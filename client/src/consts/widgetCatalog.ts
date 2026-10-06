import { WIDGET_TYPES, type WidgetType } from "./widgets";

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
  { type: WIDGET_TYPES.overview, title: "World route overview", description: "The whole planned route with what you've flown so far and where the plane is.", width: 640, height: 360 },
  { type: WIDGET_TYPES.location, title: "Now over", description: "Country you're flying over with its flag and the nearest airport.", width: 420, height: 130 },
  { type: WIDGET_TYPES.leg, title: "Current leg", description: "The leg you're flying, airport names, distance left and leg progress.", width: 460, height: 160 },
  { type: WIDGET_TYPES.phase, title: "Flight phase", description: "Parked, taxi, takeoff, climb, cruise, descent, approach or landed.", width: 320, height: 120 },
  { type: WIDGET_TYPES.landing, title: "Landing rate", description: "Touchdown rate of the last landing with a rating and your best landing.", width: 340, height: 150 },
  { type: WIDGET_TYPES.trip, title: "Trip stats", description: "Distance, air time, airports, countries and days on the trip.", width: 900, height: 110 },
  { type: WIDGET_TYPES.autopilot, title: "Autopilot", description: "Annunciators for the active autopilot modes and their targets.", width: 620, height: 90 },
  { type: WIDGET_TYPES.config, title: "Aircraft configuration", description: "Gear, flaps, trim and seatbelt sign.", width: 520, height: 90 },
  { type: WIDGET_TYPES.log, title: "Recent stops", description: "The last airports you stopped at on this trip.", width: 360, height: 220 },
  { type: WIDGET_TYPES.profile, title: "Altitude profile", description: "Altitude chart of the current flight.", width: 520, height: 180 },
  { type: WIDGET_TYPES.session, title: "Session", description: "How long and how far you've flown in this session.", width: 300, height: 130 },
  { type: WIDGET_TYPES.weather, title: "Weather", description: "Live METAR at the nearest airport: wind, temperature, pressure and flight category.", width: 460, height: 150 },
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
