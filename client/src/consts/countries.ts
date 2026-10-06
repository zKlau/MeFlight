export const COUNTRY_SCOPES = {
  trip: "trip",
  all: "all",
} as const;

export type CountryScope = (typeof COUNTRY_SCOPES)[keyof typeof COUNTRY_SCOPES];

export const COUNTRIES_TEXT = {
  title: "Countries",
  thisTrip: "This trip",
  allFlights: "All flights",
  landed: "Landed",
  flownOver: "Flown over",
  none: "No countries yet.",
  firstVisited: "First visited",
  loadFailed: "Could not load countries.",
};

export const FLAG_URL = (code: string) => `https://flagcdn.com/${code.toLowerCase()}.svg`;
