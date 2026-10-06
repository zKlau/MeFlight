import type { NearestAirport } from "./flightPlan";

export type LocationResponse = {
  country: { code: string; name: string } | null;
  nearest_airport: NearestAirport | null;
};

export type Landing = {
  id: number;
  flightplan_id: string | null;
  created_at: string;
  rate_fpm: number;
  airport_ident: string | null;
  airport_name: string | null;
};

export type LandingsResponse = {
  count: number;
  last: Landing | null;
  best: Landing | null;
  landings: Landing[];
};

export type SessionResponse = {
  active: boolean;
  flightplan_id: string | null;
  started_at: string | null;
  last_seen_at: string | null;
  distance_nm: number;
  airborne_seconds: number;
};

export type MetarResponse = {
  ident: string;
  name: string | null;
  raw: string;
  observed_at: string | null;
  wind_direction: string | null;
  wind_speed_kt: number | null;
  wind_gust_kt: number | null;
  visibility: string | null;
  temperature_c: number | null;
  dewpoint_c: number | null;
  altimeter_hpa: number | null;
  cover: string | null;
  flight_category: string | null;
};
