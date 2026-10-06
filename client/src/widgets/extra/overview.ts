import L from "leaflet";
import { createAircraftMarker } from "../../aircraftMarker";
import { FIT_BOUNDS_PADDING_PX } from "../../consts/map";
import { FOLLOW_LIVE_PLAN } from "../../consts/widgets";
import { flightData } from "../../liveFlightData";
import { LATEST_FLIGHT } from "../../selection";
import { createFlightTrack } from "../../track/flightTrack";
import { flightPlanIdOf, isUnplacedPosition } from "../../track/trackPoint";
import { addSatelliteTiles } from "../../utils/tiles";
import { WIDGET_MAP_OPTIONS } from "../mapWidget";
import type { WidgetParams } from "../params";

const selectionFor = (planId: string | null) => {
  if (!planId) {
    return LATEST_FLIGHT;
  }

  return planId;
};

export const startOverviewWidget = (root: HTMLElement, params: WidgetParams) => {
  const map = L.map(root, WIDGET_MAP_OPTIONS).setView([0, 0], 1);
  addSatelliteTiles(map);
  map.attributionControl.setPrefix(false);

  const aircraft = createAircraftMarker(map);
  const flightTrack = createFlightTrack(map);
  const followsLive = params.plan === FOLLOW_LIVE_PLAN;
  let shownSelection: string | null = null;

  const fit = () => {
    const bounds = flightTrack.getBounds();

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [FIT_BOUNDS_PADDING_PX, FIT_BOUNDS_PADDING_PX] });
    }
  };

  const show = async (selection: string) => {
    if (selection === shownSelection) {
      return;
    }

    shownSelection = selection;
    await flightTrack.show(selection);
    fit();
  };

  if (!followsLive) {
    show(params.plan);
  }

  flightData.subscribe((live) => {
    if (followsLive) {
      show(selectionFor(flightPlanIdOf(live)));
    }

    flightTrack.addLivePoint(live);

    if (!isUnplacedPosition(live)) {
      aircraft.update(live, flightTrack.alignToTrack(live.LONGITUDE));
    }
  });

  new ResizeObserver(() => {
    map.invalidateSize();
    fit();
  }).observe(root);
  flightData.startFetch();
};
