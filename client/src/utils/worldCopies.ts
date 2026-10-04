import L from "leaflet";
import "leaflet-rotatedmarker";

const FULL_CIRCLE_DEGREES = 360;

export const WORLD_COPY_OFFSETS = [-FULL_CIRCLE_DEGREES, 0, FULL_CIRCLE_DEGREES];

export type Position = [number, number];

export const shiftPosition = ([latitude, longitude]: Position, offset: number): Position => [
  latitude,
  longitude + offset,
];

export const createWorldMarkers = (map: L.Map, options: L.MarkerOptions) => {
  const markers = WORLD_COPY_OFFSETS.map(() => L.marker([0, 0], options));

  const place = (position: Position) => {
    markers.forEach((marker, index) => marker.setLatLng(shiftPosition(position, WORLD_COPY_OFFSETS[index])));
  };

  const setRotation = (angle: number) => {
    markers.forEach((marker) => marker.setRotationAngle(angle));
  };

  const setOpacity = (opacity: number) => {
    markers.forEach((marker) => marker.setOpacity(opacity));
  };

  const setTooltip = (text: string, options: L.TooltipOptions) => {
    markers.forEach((marker) => marker.unbindTooltip().bindTooltip(text, options));
  };

  const show = () => {
    markers.forEach((marker) => marker.addTo(map));
  };

  const hide = () => {
    markers.forEach((marker) => marker.remove());
  };

  return { place, setRotation, setOpacity, setTooltip, show, hide };
};
