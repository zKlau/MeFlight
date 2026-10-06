export type CountryVisit = {
  code: string;
  name: string;
  landed: boolean;
  first_visited_at: string;
};

export type CountriesResponse = {
  flightplan_id: string | null;
  total: number;
  landed: number;
  flown_over: number;
  countries: CountryVisit[];
};
