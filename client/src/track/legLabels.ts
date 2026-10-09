import L from "leaflet";
import { LEG_LABEL_MIN_PX, LEG_TEXT } from "../consts/legs";
import { UI_TEXT } from "../consts/messages";
import { getCruiseSpeed, onCruiseSpeedChange } from "../utils/cruiseSpeed";
import {
  formatLegDistance,
  formatLegTime,
  legDistanceM,
  midpoint,
  secondsAtSpeed,
  uprightAngle,
  type LegPosition,
} from "../utils/legMath";
import { shiftPosition, WORLD_COPY_OFFSETS } from "../utils/worldCopies";

const LABEL_CLASS = "leg-label";
const HIDDEN_CLASS = "leg-label--hidden";

type LegLabel = {
  marker: L.Marker;
  start: LegPosition;
  end: LegPosition;
};

const labelHtml = (meters: number, angle: number) => `
  <div class="leg-label__inner" style="transform: translate(-50%, -50%) rotate(${angle}deg)">
    <span class="leg-label__distance">${formatLegDistance(meters, UI_TEXT.nauticalMilesUnit, LEG_TEXT.kilometers)}</span>
    <span class="leg-label__time">${formatLegTime(secondsAtSpeed(meters, getCruiseSpeed()))}</span>
  </div>
`;

const createLabel = (start: LegPosition, end: LegPosition): LegLabel => {
  const icon = L.divIcon({ className: LABEL_CLASS, html: labelHtml(legDistanceM(start, end), uprightAngle(start, end)), iconSize: [0, 0] });
  return { marker: L.marker(midpoint(start, end), { icon, interactive: false, keyboard: false }), start, end };
};

export const createLegLabels = (map: L.Map) => {
  const layer = L.featureGroup().addTo(map);
  let labels: LegLabel[] = [];
  let positions: LegPosition[] = [];

  const fitsOnScreen = (label: LegLabel) =>
    map.latLngToLayerPoint(label.start).distanceTo(map.latLngToLayerPoint(label.end)) >= LEG_LABEL_MIN_PX;

  const updateVisibility = () => {
    labels.forEach((label) => {
      const element = label.marker.getElement();

      if (element) {
        element.classList.toggle(HIDDEN_CLASS, !fitsOnScreen(label));
      }
    });
  };

  const render = () => {
    layer.clearLayers();
    labels = [];

    for (const offset of WORLD_COPY_OFFSETS) {
      const shifted = positions.map((position) => shiftPosition(position, offset));

      for (let index = 0; index < shifted.length - 1; index += 1) {
        const label = createLabel(shifted[index], shifted[index + 1]);
        label.marker.addTo(layer);
        labels.push(label);
      }
    }

    updateVisibility();
  };

  const draw = (routePositions: LegPosition[]) => {
    positions = routePositions;
    render();
  };

  const clear = () => {
    positions = [];
    render();
  };

  map.on("zoomend", updateVisibility);
  layer.on("add", updateVisibility);
  onCruiseSpeedChange(render);

  return { layer, draw, clear };
};
