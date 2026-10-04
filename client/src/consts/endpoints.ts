export const ENDPOINTS = {
  live: "live",
  track: "track",
  flightPlans: "flightplans",
  flightPlanRoute: (flightPlanId: string) => `flightplans/${flightPlanId}/route`,
  flightPlanTrack: (flightPlanId: string) => `flightplans/${flightPlanId}/track`,
  flightPlanProgress: (flightPlanId: string) => `flightplans/${flightPlanId}/progress`,
  flightPlanLastState: (flightPlanId: string) => `flightplans/${flightPlanId}/last-state`,
};
