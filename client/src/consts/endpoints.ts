export const ENDPOINTS = {
  live: "live",
  track: "track",
  flightPlans: "flightplans",
  countries: "countries",
  flightPlanCountries: (flightPlanId: string) => `flightplans/${flightPlanId}/countries`,
  airportNames: (idents: string[]) => `airports/names?idents=${encodeURIComponent(idents.join(","))}`,
  flightPlanRoute: (flightPlanId: string) => `flightplans/${flightPlanId}/route`,
  flightPlanTrack: (flightPlanId: string) => `flightplans/${flightPlanId}/track`,
  flightPlanProgress: (flightPlanId: string) => `flightplans/${flightPlanId}/progress`,
  flightPlanLastState: (flightPlanId: string) => `flightplans/${flightPlanId}/last-state`,
};
