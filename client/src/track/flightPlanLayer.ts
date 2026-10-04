import L from "leaflet";
import { fetchJson } from "../apiService";
import { ENDPOINTS } from "../consts/endpoints";
import {
  AIRPORT_MARKER_STYLE,
  AIRPORT_WAYPOINT_TYPE,
  PLAN_LINE_STYLE,
  VISITED_AIRPORT_MARKER_STYLE,
  WAYPOINT_MARKER_STYLE,
  WAYPOINT_TOOLTIP_OPTIONS,
} from "../consts/flightPlan";
import { LOG_MESSAGES } from "../consts/messages";
import type { FlightPlanRoutePoint, FlightPlanRouteResponse } from "../types";
import { unwrapLongitudes } from "../utils/geo";
import { shiftPosition, WORLD_COPY_OFFSETS, type Position } from "../utils/worldCopies";

const waypointStyle = (waypoint: FlightPlanRoutePoint, visited: Set<number>) => {
  if (waypoint.waypoint_type !== AIRPORT_WAYPOINT_TYPE) {
    return WAYPOINT_MARKER_STYLE;
  }

  if (visited.has(waypoint.order_index)) {
    return VISITED_AIRPORT_MARKER_STYLE;
  }

  return AIRPORT_MARKER_STYLE;
};

export const createFlightPlanLayer = (map: L.Map) => {
  const layer = L.featureGroup().addTo(map);
  const markers = new Map<FlightPlanRoutePoint, L.CircleMarker[]>();
  let bounds = L.latLngBounds([]);
  let flightPlanId: string | null = null;
  let visited = new Set<number>();

  const drawWaypoint = (waypoint: FlightPlanRoutePoint, position: Position) =>
    WORLD_COPY_OFFSETS.map((offset) =>
      L.circleMarker(shiftPosition(position, offset), waypointStyle(waypoint, visited))
        .bindTooltip(waypoint.identifier, WAYPOINT_TOOLTIP_OPTIONS)
        .addTo(layer),
    );

  const draw = (route: FlightPlanRouteResponse) => {
    const positions = unwrapLongitudes(route.points.map((waypoint) => [waypoint.latitude, waypoint.longitude]));

    for (const offset of WORLD_COPY_OFFSETS) {
      L.polyline(positions.map((position) => shiftPosition(position, offset)), PLAN_LINE_STYLE).addTo(layer);
    }

    route.points.forEach((waypoint, index) => markers.set(waypoint, drawWaypoint(waypoint, positions[index])));
    bounds = L.latLngBounds(positions);
  };

  const fetchAndDraw = async (id: string) => {
    try {
      draw(await fetchJson<FlightPlanRouteResponse>(ENDPOINTS.flightPlanRoute(id)));
    } catch (error) {
      console.warn(LOG_MESSAGES.flightPlanFetchFailed, error);
    }
  };

  const clear = () => {
    layer.clearLayers();
    markers.clear();
    bounds = L.latLngBounds([]);
  };

  const show = async (id: string | null) => {
    if (id === flightPlanId) {
      return;
    }

    flightPlanId = id;
    clear();

    if (id) {
      await fetchAndDraw(id);
    }
  };

  const markVisited = (orderIndices: number[]) => {
    visited = new Set(orderIndices);
    markers.forEach((copies, waypoint) => copies.forEach((marker) => marker.setStyle(waypointStyle(waypoint, visited))));
  };

  const getBounds = () => L.latLngBounds(bounds.getSouthWest(), bounds.getNorthEast());

  return { layer, show, markVisited, getBounds };
};
