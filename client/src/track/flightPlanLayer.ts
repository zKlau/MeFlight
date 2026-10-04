import L from "leaflet";
import { fetchJson } from "../apiService";
import { ENDPOINTS } from "../consts/endpoints";
import {
  AIRPORT_MARKER_STYLE,
  AIRPORT_WAYPOINT_TYPE,
  PLAN_LINE_STYLE,
  WAYPOINT_MARKER_STYLE,
  WAYPOINT_TOOLTIP_OPTIONS,
} from "../consts/flightPlan";
import { LOG_MESSAGES } from "../consts/messages";
import type { FlightPlanRoutePoint, FlightPlanRouteResponse } from "../types";

const waypointStyle = (waypoint: FlightPlanRoutePoint) => {
  if (waypoint.waypoint_type === AIRPORT_WAYPOINT_TYPE) {
    return AIRPORT_MARKER_STYLE;
  }

  return WAYPOINT_MARKER_STYLE;
};

export const createFlightPlanLayer = (map: L.Map) => {
  const layer = L.featureGroup().addTo(map);
  let flightPlanId: string | null = null;

  const drawWaypoint = (waypoint: FlightPlanRoutePoint) => {
    L.circleMarker([waypoint.latitude, waypoint.longitude], waypointStyle(waypoint))
      .bindTooltip(waypoint.identifier, WAYPOINT_TOOLTIP_OPTIONS)
      .addTo(layer);
  };

  const draw = (route: FlightPlanRouteResponse) => {
    L.polyline(route.coordinates, PLAN_LINE_STYLE).addTo(layer);
    route.points.forEach(drawWaypoint);
  };

  const fetchAndDraw = async (id: string) => {
    try {
      draw(await fetchJson<FlightPlanRouteResponse>(ENDPOINTS.flightPlanRoute(id)));
    } catch (error) {
      console.warn(LOG_MESSAGES.flightPlanFetchFailed, error);
    }
  };

  const show = async (id: string | null) => {
    if (id === flightPlanId) {
      return;
    }

    flightPlanId = id;
    layer.clearLayers();

    if (id) {
      await fetchAndDraw(id);
    }
  };

  return { layer, show };
};
