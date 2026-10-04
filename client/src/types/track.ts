export type TrackPoint = {
  lat: number;
  lon: number;
  altitude: number;
  airspeed: number;
  heading: number;
  timestamp: string;
};

export type TrackResponse = {
  flightplan_id: string | null;
  started_at: string | null;
  total_points: number;
  distance_nm: number;
  points: TrackPoint[];
};

export type TrackStats = {
  distanceNm: number;
  durationMs: number;
  points: number;
};

export type FlightPlanRoutePoint = {
  order_index: number;
  identifier: string;
  waypoint_type: string | null;
  latitude: number;
  longitude: number;
  altitude: number | null;
};

export type FlightPlanRouteResponse = {
  flightplan_id: string;
  title: string | null;
  departure_id: string | null;
  destination_id: string | null;
  total_points: number;
  coordinates: [number, number][];
  points: FlightPlanRoutePoint[];
};
