import { ENDPOINTS } from "../../consts/endpoints";
import { EXTRA_TEXT, MS_PER_DAY, TRIP_COUNTRIES_REFRESH_MS } from "../../consts/extraWidgets";
import { ONE_SECOND_MS } from "../../consts/time";
import { WIDGET_TEXT } from "../../consts/widgets";
import type { CountriesResponse, FlightPlanProgress } from "../../types";
import { formatDuration } from "../../utils/format";
import { createWidgetFeed, type WidgetContext } from "../dataFeed";
import type { WidgetParams } from "../params";
import { createWidgetRenderer } from "../render";
import type { WidgetView } from "../valueWidgets";
import { formatWhole } from "../widgetFormat";
import { fetchQuietly } from "./shared";

const STAT_COUNT = 5;
const DATE_FORMAT: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };

const stat = (label: string, value: string, detail: string): WidgetView => ({ label, value, detail, fraction: null });

const emptyStats = () =>
  [EXTRA_TEXT.tripDistance, EXTRA_TEXT.tripAirTime, EXTRA_TEXT.tripAirports, EXTRA_TEXT.tripCountries, EXTRA_TEXT.tripDay].map(
    (label) => stat(label, WIDGET_TEXT.empty, ""),
  );

const dayStat = (progress: FlightPlanProgress) => {
  if (!progress.first_flown_at) {
    return stat(EXTRA_TEXT.tripDay, WIDGET_TEXT.empty, "");
  }

  const started = new Date(progress.first_flown_at);
  const day = Math.floor((Date.now() - started.getTime()) / MS_PER_DAY) + 1;
  return stat(EXTRA_TEXT.tripDay, String(day), started.toLocaleDateString([], DATE_FORMAT));
};

const countriesStat = (countries: CountriesResponse | null) => {
  if (!countries) {
    return stat(EXTRA_TEXT.tripCountries, WIDGET_TEXT.empty, "");
  }

  return stat(EXTRA_TEXT.tripCountries, String(countries.total), `${countries.landed} ${WIDGET_TEXT.landed}`);
};

const tripStats = (progress: FlightPlanProgress, countries: CountriesResponse | null) => [
  stat(EXTRA_TEXT.tripDistance, `${formatWhole(progress.flown_distance_nm)} ${WIDGET_TEXT.nauticalMiles}`, `${WIDGET_TEXT.of} ${formatWhole(progress.planned_distance_nm)}`),
  stat(EXTRA_TEXT.tripAirTime, formatDuration(progress.airborne_seconds * ONE_SECOND_MS), `${progress.sessions} ${EXTRA_TEXT.sessions}`),
  stat(EXTRA_TEXT.tripAirports, `${progress.airports_visited.length}`, `${WIDGET_TEXT.of} ${progress.airports_total}`),
  countriesStat(countries),
  dayStat(progress),
];

export const startTripWidget = (root: HTMLElement, params: WidgetParams) => {
  const feed = createWidgetFeed(params.plan);
  let countries: CountriesResponse | null = null;
  let countriesPlanId: string | null = null;
  let latest: WidgetContext | null = null;

  const views = (context: WidgetContext) => {
    if (!context.progress) {
      return emptyStats();
    }

    return tripStats(context.progress, countries);
  };

  const render = createWidgetRenderer(root, params, views, STAT_COUNT);

  const refreshCountries = async () => {
    if (!latest || !latest.planId) {
      return;
    }

    countriesPlanId = latest.planId;
    countries = await fetchQuietly<CountriesResponse>(ENDPOINTS.flightPlanCountries(latest.planId));
    render(latest);
  };

  feed.subscribe((context) => {
    latest = context;
    render(context);

    if (context.planId !== countriesPlanId) {
      refreshCountries();
    }
  });
  feed.start();
  setInterval(refreshCountries, TRIP_COUNTRIES_REFRESH_MS);
};
