import { ENDPOINTS } from "../../consts/endpoints";
import { EXTRA_TEXT, PROFILE_MIN_DISTANCE_M, PROFILE_REFRESH_MS } from "../../consts/extraWidgets";
import { WIDGET_TEXT } from "../../consts/widgets";
import { flightData } from "../../liveFlightData";
import { isUnplacedPosition } from "../../track/trackPoint";
import type { AircraftTelemetry, TrackResponse } from "../../types";
import { parseAltitude } from "../../utils/format";
import type { WidgetParams } from "../params";
import { formatWhole } from "../widgetFormat";
import { createPanel, type Panel } from "./panel";
import { fetchQuietly, startPolling } from "./shared";

const SVG_NS = "http://www.w3.org/2000/svg";
const VIEW_WIDTH = 500;
const VIEW_HEIGHT = 100;
const MIN_SCALE_FT = 1000;

type ProfilePoint = { time: number; altitude: number };

const svgElement = (tag: string, className: string) => {
  const node = document.createElementNS(SVG_NS, tag);
  node.setAttribute("class", className);
  return node;
};

const createChart = (root: HTMLElement) => {
  const svg = svgElement("svg", "profile");
  const area = svgElement("polygon", "profile__area");
  const line = svgElement("polyline", "profile__line");
  svg.setAttribute("viewBox", `0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`);
  svg.setAttribute("preserveAspectRatio", "none");
  svg.append(area, line);
  root.append(svg);
  return { area, line };
};

const toCoordinates = (points: ProfilePoint[]) => {
  const start = points[0].time;
  const span = Math.max(points[points.length - 1].time - start, 1);
  const ceiling = Math.max(MIN_SCALE_FT, ...points.map((point) => point.altitude));
  return points.map((point) => `${((point.time - start) / span) * VIEW_WIDTH},${VIEW_HEIGHT - (point.altitude / ceiling) * VIEW_HEIGHT}`);
};

const fromTrack = (track: TrackResponse): ProfilePoint[] =>
  track.points.map((point) => ({ time: Date.parse(point.timestamp), altitude: point.altitude }));

export const startProfileWidget = (root: HTMLElement, params: WidgetParams) => {
  const panel: Panel = createPanel(root, EXTRA_TEXT.profile, params.showLabel);
  const chart = createChart(root);
  let points: ProfilePoint[] = [];

  const draw = () => {
    if (points.length < 2) {
      panel.value.textContent = WIDGET_TEXT.empty;
      return;
    }

    const coordinates = toCoordinates(points);
    chart.line.setAttribute("points", coordinates.join(" "));
    chart.area.setAttribute("points", [`0,${VIEW_HEIGHT}`, ...coordinates, `${VIEW_WIDTH},${VIEW_HEIGHT}`].join(" "));
    panel.value.textContent = `${formatWhole(points[points.length - 1].altitude)} ${WIDGET_TEXT.feet}`;
    panel.detail.textContent = `${EXTRA_TEXT.max} ${formatWhole(Math.max(...points.map((point) => point.altitude)))} ${WIDGET_TEXT.feet}`;
  };

  const lastTime = () => {
    const last = points.at(-1);

    if (!last) {
      return 0;
    }

    return last.time;
  };

  const appendLive = (live: AircraftTelemetry) => {
    if (!live.created_at || isUnplacedPosition(live) || Date.parse(live.created_at) <= lastTime()) {
      return;
    }

    points.push({ time: Date.parse(live.created_at), altitude: parseAltitude(live.ALTITUDE) });
    draw();
  };

  startPolling(async () => {
    const track = await fetchQuietly<TrackResponse>(ENDPOINTS.latestTrack(PROFILE_MIN_DISTANCE_M));

    if (track) {
      points = fromTrack(track);
      draw();
    }
  }, PROFILE_REFRESH_MS);
  flightData.subscribe(appendLive);
  flightData.startFetch();
};
