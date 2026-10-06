import { ENDPOINTS } from "../../consts/endpoints";
import { EXTRA_TEXT, LOCATION_REFRESH_DISTANCE_M, LOCATION_REFRESH_MS } from "../../consts/extraWidgets";
import { WIDGET_TEXT } from "../../consts/widgets";
import { flightData } from "../../liveFlightData";
import type { LocationResponse, NearestAirport } from "../../types";
import { flagImage } from "../../utils/flags";
import { formatNm } from "../../utils/format";
import type { WidgetParams } from "../params";
import { createPanel, type Panel } from "./panel";
import { createPositionThrottle, fetchQuietly, livePosition } from "./shared";

const airportDetail = (airport: NearestAirport | null) => {
  if (!airport) {
    return "";
  }

  return `${formatNm(airport.distance_nm)} ${EXTRA_TEXT.from} ${airport.ident} · ${airport.name}`;
};

const render = (panel: Panel, location: LocationResponse) => {
  panel.detail.textContent = airportDetail(location.nearest_airport);

  if (!location.country) {
    panel.value.textContent = EXTRA_TEXT.overSea;
    return;
  }

  panel.value.replaceChildren(flagImage(location.country, "widget__flag widget__flag--inline"), location.country.name);
};

export const startLocationWidget = (root: HTMLElement, params: WidgetParams) => {
  const panel = createPanel(root, EXTRA_TEXT.nowOver, params.showLabel);
  const isDue = createPositionThrottle(LOCATION_REFRESH_DISTANCE_M, LOCATION_REFRESH_MS);
  panel.value.textContent = WIDGET_TEXT.empty;

  flightData.subscribe(async (live) => {
    const position = livePosition(live);

    if (!position || !isDue(position)) {
      return;
    }

    const location = await fetchQuietly<LocationResponse>(ENDPOINTS.location(position.lat, position.lng));

    if (location) {
      render(panel, location);
    }
  });
  flightData.startFetch();
};
