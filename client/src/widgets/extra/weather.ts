import { ENDPOINTS } from "../../consts/endpoints";
import {
  EXTRA_TEXT,
  FLIGHT_CATEGORY_TONES,
  WEATHER_AIRPORT_REFRESH_DISTANCE_M,
  WEATHER_REFRESH_MS,
} from "../../consts/extraWidgets";
import { WIDGET_TEXT } from "../../consts/widgets";
import { flightData } from "../../liveFlightData";
import type { LocationResponse, MetarResponse } from "../../types";
import type { WidgetParams } from "../params";
import { formatWhole } from "../widgetFormat";
import { createPanel, type Panel } from "./panel";
import { createPositionThrottle, fetchQuietly, livePosition } from "./shared";

const HEADING_DIGITS = 3;
const VARIABLE_WIND = "VRB";

const gustText = (metar: MetarResponse) => {
  if (!metar.wind_gust_kt) {
    return "";
  }

  return ` ${EXTRA_TEXT.gust}${formatWhole(metar.wind_gust_kt)}`;
};

const directionText = (direction: string | null) => {
  if (!direction || direction === VARIABLE_WIND) {
    return EXTRA_TEXT.variable;
  }

  return `${direction.padStart(HEADING_DIGITS, "0")}${WIDGET_TEXT.degrees}`;
};

const windText = (metar: MetarResponse) => {
  if (!metar.wind_speed_kt) {
    return EXTRA_TEXT.calm;
  }

  return `${directionText(metar.wind_direction)} ${formatWhole(metar.wind_speed_kt)} ${WIDGET_TEXT.knots}${gustText(metar)}`;
};

const temperatureText = (metar: MetarResponse) => {
  if (metar.temperature_c === null) {
    return null;
  }

  return `${formatWhole(metar.temperature_c)}${EXTRA_TEXT.celsius}`;
};

const pressureText = (metar: MetarResponse) => {
  if (metar.altimeter_hpa === null) {
    return null;
  }

  return `${EXTRA_TEXT.hectopascal}${Math.round(metar.altimeter_hpa)}`;
};

const detailText = (metar: MetarResponse) =>
  [metar.flight_category, temperatureText(metar), pressureText(metar), metar.cover].filter(Boolean).join(" · ");

const toneFor = (category: string | null) => {
  if (!category || !(category in FLIGHT_CATEGORY_TONES)) {
    return null;
  }

  return FLIGHT_CATEGORY_TONES[category];
};

const render = (panel: Panel, metar: MetarResponse) => {
  panel.label.textContent = `${EXTRA_TEXT.weather} · ${metar.ident}`;
  panel.value.textContent = windText(metar);
  panel.detail.textContent = detailText(metar);
  panel.extra.textContent = metar.raw;
  panel.setTone(toneFor(metar.flight_category));
};

const showMissing = (panel: Panel) => {
  panel.label.textContent = EXTRA_TEXT.weather;
  panel.value.textContent = WIDGET_TEXT.empty;
  panel.detail.textContent = EXTRA_TEXT.noWeather;
  panel.extra.textContent = "";
  panel.setTone(null);
};

export const startWeatherWidget = (root: HTMLElement, params: WidgetParams) => {
  const panel = createPanel(root, EXTRA_TEXT.weather, params.showLabel);
  const isDue = createPositionThrottle(WEATHER_AIRPORT_REFRESH_DISTANCE_M, WEATHER_REFRESH_MS);
  panel.value.textContent = WIDGET_TEXT.empty;

  flightData.subscribe(async (live) => {
    const position = livePosition(live);

    if (!position || !isDue(position)) {
      return;
    }

    const location = await fetchQuietly<LocationResponse>(ENDPOINTS.location(position.lat, position.lng));

    if (!location || !location.nearest_airport) {
      showMissing(panel);
      return;
    }

    const metar = await fetchQuietly<MetarResponse>(ENDPOINTS.metar(location.nearest_airport.ident));

    if (!metar) {
      showMissing(panel);
      return;
    }

    render(panel, metar);
  });
  flightData.startFetch();
};
