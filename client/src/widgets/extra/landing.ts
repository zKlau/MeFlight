import { ENDPOINTS } from "../../consts/endpoints";
import { EXTRA_TEXT, LANDING_RATINGS, LANDINGS_REFRESH_MS } from "../../consts/extraWidgets";
import { FOLLOW_LIVE_PLAN, WIDGET_TEXT } from "../../consts/widgets";
import { flightData } from "../../liveFlightData";
import { flightPlanIdOf } from "../../track/trackPoint";
import type { Landing, LandingsResponse } from "../../types";
import type { WidgetParams } from "../params";
import { formatSigned } from "../widgetFormat";
import { createPanel, type Panel } from "./panel";
import { fetchQuietly } from "./shared";

const ratingFor = (rateFpm: number) => {
  const magnitude = Math.abs(rateFpm);

  for (const rating of LANDING_RATINGS) {
    if (magnitude < rating.maxFpm) {
      return rating;
    }
  }

  return LANDING_RATINGS[LANDING_RATINGS.length - 1];
};

const rateText = (landing: Landing) => `${formatSigned(landing.rate_fpm)} ${WIDGET_TEXT.feetPerMinute}`;

const placeText = (landing: Landing) => {
  if (!landing.airport_ident) {
    return "";
  }

  return ` · ${landing.airport_ident}`;
};

const landingsWord = (count: number) => {
  if (count === 1) {
    return EXTRA_TEXT.landing;
  }

  return EXTRA_TEXT.landings;
};

const bestText = (landings: LandingsResponse) => {
  if (!landings.best) {
    return "";
  }

  return `${EXTRA_TEXT.best} ${rateText(landings.best)} · ${landings.count} ${landingsWord(landings.count)}`;
};

const render = (panel: Panel, landings: LandingsResponse) => {
  const last = landings.last;

  if (!last) {
    panel.value.textContent = WIDGET_TEXT.empty;
    panel.detail.textContent = EXTRA_TEXT.noLandings;
    panel.extra.textContent = "";
    panel.setTone(null);
    return;
  }

  const rating = ratingFor(last.rate_fpm);
  panel.value.textContent = rateText(last);
  panel.detail.textContent = `${rating.label}${placeText(last)}`;
  panel.extra.textContent = bestText(landings);
  panel.setTone(rating.tone);
};

export const startLandingWidget = (root: HTMLElement, params: WidgetParams) => {
  const panel = createPanel(root, EXTRA_TEXT.lastLanding, params.showLabel);
  const followsLive = params.plan === FOLLOW_LIVE_PLAN;
  let planId: string | null = null;

  const refresh = async () => {
    const landings = await fetchQuietly<LandingsResponse>(ENDPOINTS.landings(planId));

    if (landings) {
      render(panel, landings);
    }
  };

  if (!followsLive) {
    planId = params.plan;
  }

  if (followsLive) {
    flightData.subscribe((live) => {
      const livePlanId = flightPlanIdOf(live);

      if (livePlanId !== planId) {
        planId = livePlanId;
        refresh();
      }
    });
    flightData.startFetch();
  }

  refresh();
  setInterval(refresh, LANDINGS_REFRESH_MS);
};
