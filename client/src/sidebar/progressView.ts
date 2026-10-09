import { COORDINATE_DECIMALS, PERCENT_DECIMALS, RECENT_STOPS_LIMIT, SIDEBAR_TEXT } from "../consts/sidebar";
import { ONE_SECOND_MS } from "../consts/time";
import type { FlightPlanProgress, FlightPlanSummary, LastState } from "../types";
import { formatDateTime, formatDuration, formatNm, formatRoute, planTitle } from "../utils/format";
import { LEG_TEXT } from "../consts/legs";
import { UI_TEXT } from "../consts/messages";
import { METERS_PER_NM } from "../consts/track";
import { getCruiseSpeed } from "../utils/cruiseSpeed";
import { formatLegTime, secondsAtSpeed } from "../utils/legMath";
import { definitionList, element } from "./dom";

const UNKNOWN_WAYPOINT = "?";

const waypointIdent = (plan: FlightPlanSummary, index: number) => {
  const waypoint = plan.waypoints[index];

  if (!waypoint) {
    return UNKNOWN_WAYPOINT;
  }

  return waypoint.identifier;
};

const progressBar = (percent: number) => {
  const bar = element("div", "progress-bar");
  const fill = element("div", "progress-bar__fill");
  fill.style.width = `${percent}%`;
  bar.append(fill);
  return bar;
};

const header = (plan: FlightPlanSummary) => {
  const node = element("div", "progress-header");
  node.append(element("h2", "", planTitle(plan)), element("span", "muted", formatRoute(plan)));
  return node;
};

const parkedLocation = (state: LastState) => {
  if (!state.nearest_airport) {
    return `${state.lat.toFixed(COORDINATE_DECIMALS)}, ${state.lon.toFixed(COORDINATE_DECIMALS)}`;
  }

  return `${state.nearest_airport.ident} – ${state.nearest_airport.name}`;
};

const groundText = (state: LastState) => {
  if (state.on_ground) {
    return SIDEBAR_TEXT.onGround;
  }

  return SIDEBAR_TEXT.inFlight;
};

const parkedSection = (state: LastState | null) => {
  if (!state) {
    return [];
  }

  return [
    element("h3", "", SIDEBAR_TEXT.parked),
    definitionList([
      [SIDEBAR_TEXT.parkedAt, parkedLocation(state)],
      [SIDEBAR_TEXT.fuel, `${Math.round(state.fuel_percentage)}% · ${groundText(state)}`],
      [SIDEBAR_TEXT.lastFlown, formatDateTime(state.timestamp)],
    ]),
  ];
};

const recentStops = (progress: FlightPlanProgress) => {
  const stops = progress.airports_visited.slice(-RECENT_STOPS_LIMIT).reverse();

  if (stops.length === 0) {
    return [];
  }

  const list = element("ul", "stop-list");
  stops.forEach((stop) => list.append(element("li", "", `${stop.identifier} · ${formatDateTime(stop.visited_at)}`)));
  return [element("h3", "", SIDEBAR_TEXT.recentStops), list];
};

const routeTime = (progress: FlightPlanProgress) => {
  const speedKts = getCruiseSpeed();
  const seconds = secondsAtSpeed(progress.planned_distance_nm * METERS_PER_NM, speedKts);
  return `${formatLegTime(seconds)} ${LEG_TEXT.at} ${speedKts} ${UI_TEXT.knotsUnit}`;
};

const statistics = (plan: FlightPlanSummary, progress: FlightPlanProgress) =>
  definitionList([
    [SIDEBAR_TEXT.flown, `${formatNm(progress.flown_distance_nm)} / ${formatNm(progress.planned_distance_nm)} ${SIDEBAR_TEXT.planned}`],
    [LEG_TEXT.routeTime, routeTime(progress)],
    [SIDEBAR_TEXT.airports, `${progress.airports_visited.length} / ${progress.airports_total} ${SIDEBAR_TEXT.visited}`],
    [SIDEBAR_TEXT.currentLeg, `${waypointIdent(plan, progress.current_leg_index)} → ${waypointIdent(plan, progress.current_leg_index + 1)}`],
    [SIDEBAR_TEXT.offRoute, `${SIDEBAR_TEXT.average} ${formatNm(progress.average_deviation_nm)} · ${SIDEBAR_TEXT.maximum} ${formatNm(progress.max_deviation_nm)}`],
    [SIDEBAR_TEXT.airborne, formatDuration(progress.airborne_seconds * ONE_SECOND_MS)],
    [SIDEBAR_TEXT.sessions, String(progress.sessions)],
  ]);

const notStarted = (progress: FlightPlanProgress) => {
  if (progress.first_flown_at) {
    return [];
  }

  return [element("p", "muted", SIDEBAR_TEXT.notStarted)];
};

export const progressView = (plan: FlightPlanSummary, progress: FlightPlanProgress, lastState: LastState | null) => [
  header(plan),
  element("div", "progress-label", `${SIDEBAR_TEXT.progress} ${progress.completion_percent.toFixed(PERCENT_DECIMALS)}%`),
  progressBar(progress.completion_percent),
  ...notStarted(progress),
  statistics(plan, progress),
  ...parkedSection(lastState),
  ...recentStops(progress),
];

export const latestFlightView = () => [
  element("h2", "", SIDEBAR_TEXT.latestFlight),
  element("p", "muted", SIDEBAR_TEXT.latestFlightHint),
];

export const errorView = () => [element("p", "muted", SIDEBAR_TEXT.loadFailed)];
