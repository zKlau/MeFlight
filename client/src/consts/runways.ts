import type L from "leaflet";

export const RUNWAY_MIN_ZOOM = 11;
export const RUNWAY_LABEL_OFFSET_PX = 14;
export const RUNWAY_LABEL_CLASS = "runway-label";
export const RUNWAY_LABEL_TEXT_CLASS = "runway-label__text";
export const RUNWAY_STYLE: L.PolylineOptions = { color: "#ffffff", weight: 4, opacity: 0.9 };
export const RUNWAY_TOOLTIP_OPTIONS: L.TooltipOptions = { sticky: true };
export const RUNWAYS_PREFERENCE_DEFAULT = false;

export const RUNWAY_TEXT = {
  runways: "Runways",
  feetUnit: "ft",
  lighted: "lit",
  designatorSeparator: "/",
  separator: " · ",
};
