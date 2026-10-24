import L from "leaflet";
import { fetchJson } from "../apiService";
import { ENDPOINTS } from "../consts/endpoints";
import { LOG_MESSAGES } from "../consts/messages";
import {
  RUNWAY_LABEL_CLASS,
  RUNWAY_LABEL_OFFSET_PX,
  RUNWAY_LABEL_TEXT_CLASS,
  RUNWAY_MIN_ZOOM,
  RUNWAY_STYLE,
  RUNWAY_TEXT,
  RUNWAY_TOOLTIP_OPTIONS,
} from "../consts/runways";
import type { Runway, RunwayEnd } from "../types/runways";

const FULL_CIRCLE_DEGREES = 360;
const LONGITUDE_RANGE = [-180, 180];
const MAX_LATITUDE = 90;

const alignLongitude = (longitude: number, reference: number) =>
  longitude + FULL_CIRCLE_DEGREES * Math.round((reference - longitude) / FULL_CIRCLE_DEGREES);

const clampLatitude = (latitude: number) => Math.max(-MAX_LATITUDE, Math.min(MAX_LATITUDE, latitude));

const wrapLongitude = (longitude: number) => L.Util.wrapNum(longitude, LONGITUDE_RANGE, true);

const viewBounds = (map: L.Map) => {
  const bounds = map.getBounds();
  return {
    south: clampLatitude(bounds.getSouth()),
    west: wrapLongitude(bounds.getWest()),
    north: clampLatitude(bounds.getNorth()),
    east: wrapLongitude(bounds.getEast()),
  };
};

const endPosition = (end: RunwayEnd, referenceLongitude: number): L.LatLngTuple => [
  end.latitude,
  alignLongitude(end.longitude, referenceLongitude),
];

const runwayDescription = (runway: Runway) => {
  const parts = [`${runway.airport} ${runway.low.ident}${RUNWAY_TEXT.designatorSeparator}${runway.high.ident}`];

  if (runway.length_ft !== null) {
    parts.push(`${runway.length_ft} ${RUNWAY_TEXT.feetUnit}`);
  }

  if (runway.surface) {
    parts.push(runway.surface);
  }

  if (runway.lighted) {
    parts.push(RUNWAY_TEXT.lighted);
  }

  return parts.join(RUNWAY_TEXT.separator);
};

export const createRunwayLayer = (map: L.Map) => {
  const layer = L.layerGroup();
  let requestNumber = 0;

  const labelPosition = (threshold: L.LatLngTuple, opposite: L.LatLngTuple) => {
    const thresholdPoint = map.latLngToLayerPoint(threshold);
    const direction = thresholdPoint.subtract(map.latLngToLayerPoint(opposite));
    const length = direction.distanceTo(L.point(0, 0));

    if (length === 0) {
      return threshold;
    }

    return map.layerPointToLatLng(thresholdPoint.add(direction.multiplyBy(RUNWAY_LABEL_OFFSET_PX / length)));
  };

  const label = (ident: string, position: L.LatLngExpression) =>
    L.marker(position, {
      icon: L.divIcon({ className: RUNWAY_LABEL_CLASS, html: `<span class="${RUNWAY_LABEL_TEXT_CLASS}">${ident}</span>`, iconSize: [0, 0] }),
      interactive: false,
      keyboard: false,
    });

  const drawRunway = (runway: Runway, referenceLongitude: number) => {
    const low = endPosition(runway.low, referenceLongitude);
    const high = endPosition(runway.high, alignLongitude(runway.high.longitude, low[1]));

    L.polyline([low, high], RUNWAY_STYLE).bindTooltip(runwayDescription(runway), RUNWAY_TOOLTIP_OPTIONS).addTo(layer);
    label(runway.low.ident, labelPosition(low, high)).addTo(layer);
    label(runway.high.ident, labelPosition(high, low)).addTo(layer);
  };

  const refresh = async () => {
    requestNumber += 1;
    const currentRequest = requestNumber;

    if (!map.hasLayer(layer) || map.getZoom() < RUNWAY_MIN_ZOOM) {
      layer.clearLayers();
      return;
    }

    try {
      const runways = await fetchJson<Runway[]>(ENDPOINTS.runways(viewBounds(map)));

      if (currentRequest !== requestNumber) {
        return;
      }

      layer.clearLayers();
      const referenceLongitude = map.getCenter().lng;
      runways.forEach((runway) => drawRunway(runway, referenceLongitude));
    } catch (error) {
      console.warn(LOG_MESSAGES.runwaysFetchFailed, error);
    }
  };

  map.on("moveend", refresh);
  layer.on("add", refresh);

  return layer;
};
