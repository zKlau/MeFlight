import L from "leaflet";
import { UI_TEXT } from "../consts/messages";
import type { TrackPoint } from "../types";
import { findNearestPoint, toLatLng } from "../utils/geo";

const popupContent = (point: TrackPoint) => `
  <div class="track-popup">
    <strong>${new Date(point.timestamp).toLocaleTimeString()}</strong><br/>
    ${UI_TEXT.altitudeLabel}: ${Math.round(point.altitude).toLocaleString()} ${UI_TEXT.feetUnit}<br/>
    ${UI_TEXT.airspeedLabel}: ${Math.round(point.airspeed)} ${UI_TEXT.knotsUnit}<br/>
    ${UI_TEXT.headingLabel}: ${Math.round(point.heading)}${UI_TEXT.degreesUnit}
  </div>
`;

export const showNearestPointPopup = (
  map: L.Map,
  points: TrackPoint[],
  event: L.LeafletMouseEvent,
  offset: number,
) => {
  const nearest = findNearestPoint(points, L.latLng(event.latlng.lat, event.latlng.lng - offset));
  const position = toLatLng(nearest);

  L.popup()
    .setLatLng([position.lat, position.lng + offset])
    .setContent(popupContent(nearest))
    .openOn(map);
};
