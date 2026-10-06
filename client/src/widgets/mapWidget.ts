import L from "leaflet";
import { createAircraftMarker } from "../aircraftMarker";
import { FOLLOW_LIVE_PLAN } from "../consts/widgets";
import { flightData } from "../liveFlightData";
import { LATEST_FLIGHT } from "../selection";
import { createFlightTrack } from "../track/flightTrack";
import { isUnplacedPosition } from "../track/trackPoint";
import { addSatelliteTiles } from "../utils/tiles";
import type { WidgetParams } from "./params";

export const WIDGET_MAP_OPTIONS: L.MapOptions = {
  zoomControl: false,
  attributionControl: true,
  dragging: false,
  scrollWheelZoom: false,
  doubleClickZoom: false,
  boxZoom: false,
  keyboard: false,
};

const selectionFor = (plan: string) => {
  if (plan === FOLLOW_LIVE_PLAN) {
    return LATEST_FLIGHT;
  }

  return plan;
};

export const startMapWidget = (root: HTMLElement, params: WidgetParams) => {
  const map = L.map(root, WIDGET_MAP_OPTIONS).setView([0, 0], params.zoom);
  addSatelliteTiles(map);
  map.attributionControl.setPrefix(false);

  const aircraft = createAircraftMarker(map);
  const flightTrack = createFlightTrack(map);
  flightTrack.show(selectionFor(params.plan));

  flightData.subscribe((live) => {
    flightTrack.addLivePoint(live);

    if (isUnplacedPosition(live)) {
      return;
    }

    const longitude = flightTrack.alignToTrack(live.LONGITUDE);
    aircraft.update(live, longitude);
    map.panTo([live.LATITUDE, longitude]);
  });

  new ResizeObserver(() => map.invalidateSize()).observe(root);
  flightData.startFetch();
};
