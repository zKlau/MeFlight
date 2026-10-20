import { request } from "../api.js";
import { FREE_FLIGHT_VALUE } from "../consts.js";
import { EDITOR_ENDPOINTS } from "../editor/editorConsts.js";
import { displayPositions } from "../editor/geo.js";
import { createLegLabels } from "../editor/legLabels.js";
import { createBaseMap, fitPositions } from "../map/baseMap.js";
import { ROUTE_STYLE, TOOLTIP_OPTIONS } from "../map/mapConsts.js";
import { getSelectedPlanId, onPlanSelected } from "../state.js";
import { getLastStatus, onStatus } from "../status.js";
import { createAircraftMarker, wholeNumber } from "./aircraftMarker.js";
import { storeFollow } from "./followPreference.js";
import { FOLLOW_ZOOM, LIVE_TEXT, WAYPOINT_STYLE } from "./liveConsts.js";

const flightText = (status) => {
  const heading = `${LIVE_TEXT.heading} ${wholeNumber(status.heading)}${LIVE_TEXT.degrees}`;
  const speed = `${LIVE_TEXT.groundSpeed} ${wholeNumber(status.ground_speed)} ${LIVE_TEXT.knots}`;
  return `${heading}${LIVE_TEXT.separator}${speed}`;
};

export const mountLiveView = (container, followInput, statusLine) => {
  const { map, destroy: destroyMap } = createBaseMap(container);
  const routeLayer = L.layerGroup().addTo(map);
  const legs = createLegLabels(map);
  const aircraft = createAircraftMarker(map);
  let routeMessage = "";
  let routeRequest = 0;
  let hasCentered = false;

  const showMessage = (status, position) => {
    if (routeMessage) {
      statusLine.textContent = routeMessage;
      return;
    }

    if (!position) {
      statusLine.textContent = LIVE_TEXT.waitingForSim;
      return;
    }

    statusLine.textContent = flightText(status);
  };

  const followAircraft = (position) => {
    if (!followInput.checked) {
      return;
    }

    if (hasCentered) {
      map.panTo(position);
      return;
    }

    hasCentered = true;
    map.setView(position, Math.max(map.getZoom(), FOLLOW_ZOOM));
  };

  const updateAircraft = (status) => {
    const position = aircraft.update(status);
    showMessage(status, position);

    if (position) {
      followAircraft(position);
    }
  };

  const drawRoute = (waypoints) => {
    const positions = displayPositions(waypoints);
    L.polyline(positions, ROUTE_STYLE).addTo(routeLayer);
    waypoints.forEach((waypoint, index) => {
      L.circleMarker(positions[index], WAYPOINT_STYLE).bindTooltip(waypoint.identifier, TOOLTIP_OPTIONS).addTo(routeLayer);
    });
    legs.draw(positions);
    return positions;
  };

  const loadRoute = async (planId) => {
    routeRequest += 1;
    const requestNumber = routeRequest;
    routeLayer.clearLayers();
    legs.draw([]);

    if (planId === FREE_FLIGHT_VALUE) {
      routeMessage = LIVE_TEXT.freeFlight;
      updateAircraft(getLastStatus());
      return;
    }

    routeMessage = LIVE_TEXT.loading;
    updateAircraft(getLastStatus());

    try {
      const plan = await request(EDITOR_ENDPOINTS.plan(planId));

      if (requestNumber !== routeRequest) {
        return;
      }

      routeMessage = "";
      const positions = drawRoute(plan.waypoints);

      if (!followInput.checked) {
        fitPositions(map, positions);
      }
    } catch (error) {
      routeMessage = error.message;
    }

    updateAircraft(getLastStatus());
  };

  const stopFollowingOnDrag = () => {
    followInput.checked = false;
    storeFollow(false);
  };

  const refollow = () => {
    hasCentered = false;
    updateAircraft(getLastStatus());
  };

  map.on("dragstart", stopFollowingOnDrag);
  followInput.addEventListener("change", refollow);
  const stopStatus = onStatus(updateAircraft);
  const stopPlan = onPlanSelected(loadRoute);
  loadRoute(getSelectedPlanId());

  const destroy = () => {
    routeRequest += 1;
    followInput.removeEventListener("change", refollow);
    stopStatus();
    stopPlan();
    legs.destroy();
    destroyMap();
  };

  return { destroy };
};
