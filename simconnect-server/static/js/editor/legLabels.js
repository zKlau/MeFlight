import { getCruiseSpeed, onCruiseSpeedChange } from "./cruiseSpeed.js";
import { LEG_LABEL_MIN_PX } from "./editorConsts.js";
import { formatDistance, formatTime, legDistanceM, midpoint, secondsAtSpeed, uprightAngle } from "./legMath.js";

const LABEL_CLASS = "leg-label";
const HIDDEN_CLASS = "leg-label--hidden";

const labelHtml = (meters, angle) => `
  <div class="leg-label__inner" style="transform: translate(-50%, -50%) rotate(${angle}deg)">
    <span class="leg-label__distance">${formatDistance(meters)}</span>
    <span class="leg-label__time">${formatTime(secondsAtSpeed(meters, getCruiseSpeed()))}</span>
  </div>
`;

const createLabel = (start, end) => {
  const icon = L.divIcon({ className: LABEL_CLASS, html: labelHtml(legDistanceM(start, end), uprightAngle(start, end)), iconSize: [0, 0] });
  return { marker: L.marker(midpoint(start, end), { icon, interactive: false, keyboard: false }), start, end };
};

export const createLegLabels = (map) => {
  const layer = L.layerGroup().addTo(map);
  let labels = [];
  let positions = [];

  const fitsOnScreen = (label) =>
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

    for (let index = 0; index < positions.length - 1; index += 1) {
      const label = createLabel(positions[index], positions[index + 1]);
      label.marker.addTo(layer);
      labels.push(label);
    }

    updateVisibility();
  };

  const draw = (routePositions) => {
    positions = routePositions;
    render();
  };

  map.on("zoomend", updateVisibility);
  onCruiseSpeedChange(render);

  return { draw };
};
