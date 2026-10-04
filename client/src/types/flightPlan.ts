import type { FlightPlanRoutePoint } from "./track";

export type FlightPlanSummary = {
  id: string;
  title: string | null;
  departure_id: string | null;
  destination_id: string | null;
  total_waypoints: number;
  created_at: string;
  waypoints: FlightPlanRoutePoint[];
};

export type VisitedAirport = {
  order_index: number;
  identifier: string;
  visited_at: string;
};

export type FlightPlanProgress = {
  flightplan_id: string;
  planned_distance_nm: number;
  flown_distance_nm: number;
  completion_percent: number;
  current_leg_index: number;
  total_legs: number;
  average_deviation_nm: number;
  max_deviation_nm: number;
  airborne_seconds: number;
  recorded_seconds: number;
  sessions: number;
  airports_total: number;
  airports_visited: VisitedAirport[];
  first_flown_at: string | null;
  last_flown_at: string | null;
};

export type NearestAirport = {
  ident: string;
  name: string;
  distance_nm: number;
};

export type LastState = {
  flightplan_id: string | null;
  timestamp: string;
  lat: number;
  lon: number;
  altitude: number;
  heading: number;
  on_ground: boolean;
  fuel_percentage: number;
  fuel_total_quantity: number;
  fuel_tank_levels: Record<string, number>;
  nearest_airport: NearestAirport | null;
};
