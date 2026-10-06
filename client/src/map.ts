import L from "leaflet";
import { createAircraftMarker } from "./aircraftMarker";
import { ZOOM_CONTROL_POSITION } from "./consts/layout";
import { createFullscreenButton } from "./controls/fullscreenButton";
import { createMobileDrawer } from "./controls/mobileDrawer";
import { isLiveTelemetryFresh } from "./utils/liveness";
import { PROGRESS_REFRESH_MS } from "./consts/time";
import { LOG_MESSAGES } from "./consts/messages";
import { createFlightPanel } from "./flightPanel";
import { flightData } from "./liveFlightData";
import { createParkedMarker } from "./parkedMarker";
import { getSelection, isPlanSelection, onSelectionChange, select, selectionFromHash } from "./selection";
import { createCountriesMenu } from "./sidebar/countriesMenu";
import { createPlanList } from "./sidebar/planList";
import { createProgressCard, type PlanDetails } from "./sidebar/progressCard";
import { createFlightTrack } from "./track/flightTrack";
import { flightPlanIdOf, isUnplacedPosition } from "./track/trackPoint";
import type { AircraftTelemetry, LastState } from "./types";
import { addPlaceLabels, addSatelliteTiles } from "./utils/tiles";

let map: L.Map;
let placeLabels: L.TileLayer;
let followAircraft: boolean = true;

const leafletMap = () => {
  map = L.map("map", { zoomControl: false }).setView(flightData?.getPosition(), 13);
  addSatelliteTiles(map);
  placeLabels = addPlaceLabels(map);

  new ResizeObserver(() => map.invalidateSize()).observe(map.getContainer());
};

const elementById = (id: string) => document.getElementById(id) as HTMLElement;

export const MapSetup = () => {
  leafletMap();
  createMobileDrawer(map);
  createFullscreenButton(map);
  L.control.zoom({ position: ZOOM_CONTROL_POSITION }).addTo(map);

  const aircraft = createAircraftMarker(map);
  const parked = createParkedMarker(map);
  const flightTrack = createFlightTrack(map);
  const planList = createPlanList(elementById("plan-list"));
  const progressCard = createProgressCard(elementById("progress-card"), planList);
  createCountriesMenu(elementById("countries-menu") as HTMLDetailsElement, elementById("countries-count"), elementById("countries-body"));
  let parkedState: LastState | null = null;
  let latestLive: AircraftTelemetry | null = null;

  const setFollow = (follow: boolean) => {
    followAircraft = follow;
    panel.setFollow(follow);

    if (follow && latestLive && !isUnplacedPosition(latestLive)) {
      map.panTo([latestLive.LATITUDE, flightTrack.alignToTrack(latestLive.LONGITUDE)]);
    }
  };

  const panel = createFlightPanel(map, flightTrack, placeLabels, setFollow);
  flightTrack.onStatsChange(panel.setStats);
  map.on("dragstart", () => setFollow(false));

  const isFlyingSelection = () =>
    latestLive !== null && isLiveTelemetryFresh(latestLive) && flightPlanIdOf(latestLive) === getSelection();

  const updateParked = () => {
    if (!parkedState || isFlyingSelection()) {
      parked.hide();
      return;
    }

    parked.show(parkedState, flightTrack.alignToTrack(parkedState.lon));
  };

  const selectionBounds = () => {
    const bounds = flightTrack.getTrackBounds();

    if (parkedState) {
      bounds.extend([parkedState.lat, flightTrack.alignToTrack(parkedState.lon)]);
    }

    if (bounds.isValid()) {
      return bounds;
    }

    return flightTrack.getBounds();
  };

  const applyDetails = (details: PlanDetails | null) => {
    if (!details) {
      return;
    }

    parkedState = details.lastState;
    flightTrack.markVisited(details.progress.airports_visited.map((airport) => airport.order_index));
    updateParked();
  };

  const applySelection = async (selection: string) => {
    parkedState = null;
    parked.hide();
    flightTrack.markVisited([]);
    setFollow(!isPlanSelection(selection));

    const [, details] = await Promise.all([flightTrack.show(selection), progressCard.show(selection)]);

    if (selection !== getSelection()) {
      return;
    }

    applyDetails(details);

    if (isPlanSelection(selection)) {
      panel.fitBounds(selectionBounds());
    }
  };

  const refreshProgressWhileFlying = async () => {
    if (isFlyingSelection()) {
      applyDetails(await progressCard.show(getSelection()));
    }
  };

  onSelectionChange(applySelection);
  setInterval(refreshProgressWhileFlying, PROGRESS_REFRESH_MS);

  flightData.subscribe((data) => {
    latestLive = data;
    flightTrack.addLivePoint(data);
    const longitude = flightTrack.alignToTrack(data.LONGITUDE);
    aircraft.update(data, longitude);
    updateParked();

    if (followAircraft && !isUnplacedPosition(data)) {
      map.panTo([data.LATITUDE, longitude]);
    }
  });

  planList
    .load()
    .catch((error) => console.warn(LOG_MESSAGES.plansFetchFailed, error))
    .finally(() => select(selectionFromHash()));
};
