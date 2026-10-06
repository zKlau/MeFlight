import L from "leaflet";
import { EXTRA_TEXT } from "../../consts/extraWidgets";
import { WIDGET_TEXT } from "../../consts/widgets";
import type { FlightPlanRoutePoint } from "../../types";
import { createWidgetFeed, type WidgetContext } from "../dataFeed";
import type { WidgetParams } from "../params";
import { metersToNm } from "../routeMetrics";
import { formatWhole } from "../widgetFormat";
import { createPanel, type Panel } from "./panel";
import { livePosition, loadAirportNames } from "./shared";

type Leg = {
  index: number;
  total: number;
  start: FlightPlanRoutePoint;
  end: FlightPlanRoutePoint;
};

const toLatLng = (waypoint: FlightPlanRoutePoint) => L.latLng(waypoint.latitude, waypoint.longitude);

const currentLeg = (context: WidgetContext): Leg | null => {
  const { route, progress } = context;

  if (!route || !progress || route.points.length < 2) {
    return null;
  }

  const index = Math.min(progress.current_leg_index, route.points.length - 2);
  return { index, total: route.points.length - 1, start: route.points[index], end: route.points[index + 1] };
};

const namesLine = (leg: Leg, names: Map<string, string>) => {
  const startName = names.get(leg.start.identifier);
  const endName = names.get(leg.end.identifier);

  if (!startName || !endName) {
    return "";
  }

  return `${startName} → ${endName}`;
};

const remainingFraction = (leg: Leg, remainingM: number) => {
  const lengthM = toLatLng(leg.start).distanceTo(toLatLng(leg.end));

  if (lengthM === 0) {
    return 1;
  }

  return 1 - remainingM / lengthM;
};

const contextPosition = (context: WidgetContext) => {
  if (!context.live) {
    return null;
  }

  return livePosition(context.live);
};

const renderDistance = (panel: Panel, leg: Leg, context: WidgetContext) => {
  const legCount = `${EXTRA_TEXT.leg} ${leg.index + 1} ${EXTRA_TEXT.of} ${leg.total}`;
  const position = contextPosition(context);

  if (!position) {
    panel.extra.textContent = legCount;
    panel.setFraction(null);
    return;
  }

  const remainingM = position.distanceTo(toLatLng(leg.end));
  panel.extra.textContent = `${formatWhole(metersToNm(remainingM))} ${WIDGET_TEXT.nauticalMiles} ${EXTRA_TEXT.left} · ${legCount}`;
  panel.setFraction(remainingFraction(leg, remainingM));
};

const renderEmpty = (panel: Panel) => {
  panel.value.textContent = WIDGET_TEXT.empty;
  panel.detail.textContent = WIDGET_TEXT.noPlan;
  panel.extra.textContent = "";
  panel.setFraction(null);
};

export const startLegWidget = (root: HTMLElement, params: WidgetParams) => {
  const panel = createPanel(root, EXTRA_TEXT.currentLeg, params.showLabel);
  const feed = createWidgetFeed(params.plan);
  let names = new Map<string, string>();

  const render = async (context: WidgetContext) => {
    const leg = currentLeg(context);

    if (!leg) {
      renderEmpty(panel);
      return;
    }

    panel.value.textContent = `${leg.start.identifier} → ${leg.end.identifier}`;
    renderDistance(panel, leg, context);
    names = await loadAirportNames([leg.start.identifier, leg.end.identifier]);
    panel.detail.textContent = namesLine(leg, names);
  };

  feed.subscribe(render);
  feed.start();
};
