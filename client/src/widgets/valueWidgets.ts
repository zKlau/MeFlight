import { PERCENT_DECIMALS } from "../consts/sidebar";
import { WIDGET_TEXT, WIDGET_TYPES, type ValueWidgetType } from "../consts/widgets";
import { parseAltitude } from "../utils/format";
import type { AircraftTelemetry } from "../types";
import type { WidgetContext } from "./dataFeed";
import { groundSpeedKts, metersToNm, routeMetrics, secondsToCover, type RouteMetrics } from "./routeMetrics";
import { formatDurationSeconds, formatEta, formatSigned, formatWhole } from "./widgetFormat";

export type WidgetView = {
  label: string;
  value: string;
  detail: string;
  fraction: number | null;
};

type ValueWidget = (context: WidgetContext) => WidgetView;
type LiveContext = WidgetContext & { live: AircraftTelemetry };

const PERCENT = 100;
const NO_DETAIL = "";

const view = (label: string, value: string, detail: string, fraction: number | null = null): WidgetView => ({
  label,
  value,
  detail,
  fraction,
});

const withLive = (label: string, render: (context: LiveContext) => WidgetView) =>
  (context: WidgetContext) => {
    const live = context.live;

    if (!live) {
      return view(label, WIDGET_TEXT.empty, NO_DETAIL);
    }

    return render({ ...context, live });
  };

const withRoute = (label: string, render: (context: WidgetContext, metrics: RouteMetrics) => WidgetView) =>
  (context: WidgetContext) => {
    const metrics = routeMetrics(context);

    if (!metrics) {
      return view(label, WIDGET_TEXT.empty, WIDGET_TEXT.noPlan);
    }

    return render(context, metrics);
  };

const fuelDetail = (gallons: number | undefined) => {
  if (!gallons) {
    return NO_DETAIL;
  }

  return `${formatWhole(gallons)} ${WIDGET_TEXT.gallons}`;
};

const progressWidget: ValueWidget = (context) => {
  const progress = context.progress;

  if (!progress) {
    return view(WIDGET_TEXT.progress, WIDGET_TEXT.empty, WIDGET_TEXT.noPlan);
  }

  return view(
    WIDGET_TEXT.progress,
    `${progress.completion_percent.toFixed(PERCENT_DECIMALS)}%`,
    `${formatWhole(progress.flown_distance_nm)} ${WIDGET_TEXT.of} ${formatWhole(progress.planned_distance_nm)} ${WIDGET_TEXT.nauticalMiles}`,
    progress.completion_percent / PERCENT,
  );
};

export const VALUE_WIDGETS: Record<ValueWidgetType, ValueWidget> = {
  [WIDGET_TYPES.speed]: withLive(WIDGET_TEXT.speed, ({ live }) =>
    view(WIDGET_TEXT.speed, `${formatWhole(live.AIRSPEED_INDICATE)} ${WIDGET_TEXT.knots}`, `${WIDGET_TEXT.groundSpeed} ${formatWhole(groundSpeedKts(live))} ${WIDGET_TEXT.knots}`),
  ),
  [WIDGET_TYPES.altitude]: withLive(WIDGET_TEXT.altitude, ({ live }) =>
    view(WIDGET_TEXT.altitude, `${formatWhole(parseAltitude(live.ALTITUDE))} ${WIDGET_TEXT.feet}`, `${formatSigned(live.VERTICAL_SPEED)} ${WIDGET_TEXT.feetPerMinute}`),
  ),
  [WIDGET_TYPES.heading]: withLive(WIDGET_TEXT.heading, ({ live }) =>
    view(WIDGET_TEXT.heading, `${formatWhole(live.MAGNETIC_COMPASS)}${WIDGET_TEXT.degrees}`, WIDGET_TEXT.magnetic),
  ),
  [WIDGET_TYPES.fuel]: withLive(WIDGET_TEXT.fuel, ({ live }) =>
    view(WIDGET_TEXT.fuel, `${formatWhole(live.FUEL_PERCENTAGE)}%`, fuelDetail(live.FUEL_TOTAL_QUANTITY), live.FUEL_PERCENTAGE / PERCENT),
  ),
  [WIDGET_TYPES.progress]: progressWidget,
  [WIDGET_TYPES.distance]: withRoute(WIDGET_TEXT.distance, (_, metrics) =>
    view(WIDGET_TEXT.distance, `${formatWhole(metersToNm(metrics.remainingM))} ${WIDGET_TEXT.nauticalMiles}`, `${WIDGET_TEXT.to} ${metrics.destination.identifier}`),
  ),
  [WIDGET_TYPES.timeLeft]: withRoute(WIDGET_TEXT.timeLeft, (context, metrics) => {
    const seconds = secondsToCover(metrics.remainingM, groundSpeedKts(context.live));
    return view(WIDGET_TEXT.timeLeft, formatDurationSeconds(seconds), `${WIDGET_TEXT.eta} ${formatEta(seconds)} · ${metrics.destination.identifier}`);
  }),
  [WIDGET_TYPES.next]: withRoute(WIDGET_TEXT.next, (context, metrics) => {
    const seconds = secondsToCover(metrics.distanceToNextM, groundSpeedKts(context.live));
    return view(WIDGET_TEXT.next, metrics.next.identifier, `${formatWhole(metersToNm(metrics.distanceToNextM))} ${WIDGET_TEXT.nauticalMiles} · ${formatDurationSeconds(seconds)}`);
  }),
};

export const STRIP_ITEMS: ValueWidgetType[] = [
  WIDGET_TYPES.speed,
  WIDGET_TYPES.altitude,
  WIDGET_TYPES.heading,
  WIDGET_TYPES.fuel,
  WIDGET_TYPES.progress,
];
