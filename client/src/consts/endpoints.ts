const landingsPath = (flightPlanId: string | null) => {
  if (!flightPlanId) {
    return "landings";
  }

  return `landings?flightplan_id=${flightPlanId}`;
};

export const ENDPOINTS = {
  live: "live",
  track: "track",
  flightPlans: "flightplans",
  countries: "countries",
  session: "session",
  location: (latitude: number, longitude: number) => `location?lat=${latitude}&lon=${longitude}`,
  landings: (flightPlanId: string | null) => landingsPath(flightPlanId),
  metar: (ident: string) => `weather/metar?ident=${encodeURIComponent(ident)}`,
  latestTrack: (minDistanceM: number) => `track?min_distance_m=${minDistanceM}`,
  flightPlanCountries: (flightPlanId: string) => `flightplans/${flightPlanId}/countries`,
  airportNames: (idents: string[]) => `airports/names?idents=${encodeURIComponent(idents.join(","))}`,
  flightPlanRoute: (flightPlanId: string) => `flightplans/${flightPlanId}/route`,
  flightPlanTrack: (flightPlanId: string) => `flightplans/${flightPlanId}/track`,
  flightPlanProgress: (flightPlanId: string) => `flightplans/${flightPlanId}/progress`,
  flightPlanLastState: (flightPlanId: string) => `flightplans/${flightPlanId}/last-state`,
};
