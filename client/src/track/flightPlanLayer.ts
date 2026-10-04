import L from "leaflet";
import { fetchJson } from "../apiService";
import { ENDPOINTS } from "../consts/endpoints";
import {
  AIRPORT_LABEL_SEPARATOR,
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

const isAirport = (waypoint: FlightPlanRoutePoint) => waypoint.waypoint_type === AIRPORT_WAYPOINT_TYPE;

const airportLabel = (waypoint: FlightPlanRoutePoint, names: Record<string, string>) => {
  const name = names[waypoint.identifier.toUpperCase()];

  if (!name) {
    return waypoint.identifier;
  }

  return `${waypoint.identifier}${AIRPORT_LABEL_SEPARATOR}${name}`;
};

const waypointStyle = (waypoint: FlightPlanRoutePoint, visited: Set<number>) => {
  if (!isAirport(waypoint)) {
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

  const applyAirportNames = (names: Record<string, string>) => {
    markers.forEach((copies, waypoint) => {
      if (isAirport(waypoint)) {
        copies.forEach((marker) => marker.setTooltipContent(airportLabel(waypoint, names)));
      }
    });
  };

  const loadAirportNames = async (route: FlightPlanRouteResponse, id: string) => {
    const idents = [...new Set(route.points.filter(isAirport).map((waypoint) => waypoint.identifier))];

    try {
      const names = await fetchJson<Record<string, string>>(ENDPOINTS.airportNames(idents));

      if (id === flightPlanId) {
        applyAirportNames(names);
      }
    } catch (error) {
      console.warn(LOG_MESSAGES.airportNamesFetchFailed, error);
    }
  };

  const fetchAndDraw = async (id: string) => {
    try {
      const route = await fetchJson<FlightPlanRouteResponse>(ENDPOINTS.flightPlanRoute(id));
      draw(route);
      loadAirportNames(route, id);
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
