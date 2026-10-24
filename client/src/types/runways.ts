export type RunwayEnd = {
  ident: string;
  latitude: number;
  longitude: number;
};

export type Runway = {
  airport: string;
  low: RunwayEnd;
  high: RunwayEnd;
  length_ft: number | null;
  width_ft: number | null;
  surface: string;
  lighted: boolean;
};
