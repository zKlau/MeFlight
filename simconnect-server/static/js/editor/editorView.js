import { createBaseMap, fitPositions } from "../map/baseMap.js";
import { ROUTE_STYLE, TOOLTIP_OPTIONS } from "../map/mapConsts.js";
import { SEGMENT_HIT_TOLERANCE_PX } from "./editorConsts.js";
import { displayPositions } from "./geo.js";
import { createLegLabels } from "./legLabels.js";

const MARKER_CLASS = "editor-point";
const POINT_Z_INDEX = 1000;
const SELECTED_CLASS = "editor-point editor-point--selected";

const POINT_SIZE = [14, 14];
const SELECTED_POINT_SIZE = [20, 20];

const pointIcon = (selected) => {
  if (selected) {
    return L.divIcon({ className: SELECTED_CLASS, iconSize: SELECTED_POINT_SIZE });
  }

  return L.divIcon({ className: MARKER_CLASS, iconSize: POINT_SIZE });
};

const zIndexFor = (selected) => {
  if (selected) {
    return POINT_Z_INDEX;
  }

  return 0;
};

export const mountEditorView = (container, model, addPoints) => {
  const { map, destroy: destroyMap } = createBaseMap(container);
  const layer = L.layerGroup().addTo(map);
  const legs = createLegLabels(map);
  let shownSelection = -1;

  const nearestSegment = (latlng, positions) => {
    const clicked = map.latLngToLayerPoint(latlng);
    let best = { index: -1, distance: Infinity };

    for (let index = 0; index < positions.length - 1; index += 1) {
      const start = map.latLngToLayerPoint(positions[index]);
      const end = map.latLngToLayerPoint(positions[index + 1]);
      const distance = L.LineUtil.pointToSegmentDistance(clicked, start, end);

      if (distance < best.distance) {
        best = { index, distance };
      }
    }

    return best;
  };

  const insertOnRoute = (event, positions) => {
    L.DomEvent.stopPropagation(event);
    const segment = nearestSegment(event.latlng, positions);

    if (segment.distance <= SEGMENT_HIT_TOLERANCE_PX) {
      model.insert(segment.index + 1, event.latlng.lat, event.latlng.lng);
    }
  };

  const createMarker = (waypoint, position, index) => {
    const selected = index === model.state.selected;
    const marker = L.marker(position, { draggable: true, icon: pointIcon(selected), zIndexOffset: zIndexFor(selected) });
    marker.bindTooltip(waypoint.identifier, TOOLTIP_OPTIONS);
    marker.on("click", () => model.select(index));
    marker.on("dragend", () => {
      const moved = marker.getLatLng();
      model.update(index, { latitude: moved.lat, longitude: moved.lng });
      model.select(index);
    });
    return marker;
  };

  const revealSelection = (state, positions) => {
    const position = positions[state.selected];

    if (state.selected === shownSelection || !position) {
      shownSelection = state.selected;
      return;
    }

    shownSelection = state.selected;

    if (!map.getBounds().contains(position)) {
      map.panTo(position);
    }
  };

  const render = (state) => {
    layer.clearLayers();
    const positions = displayPositions(state.waypoints);
    const route = L.polyline(positions, ROUTE_STYLE).addTo(layer);
    route.on("click", (event) => insertOnRoute(event, positions));
    state.waypoints.forEach((waypoint, index) => createMarker(waypoint, positions[index], index).addTo(layer));
    legs.draw(positions);
    revealSelection(state, positions);
  };

  const fit = () => {
    map.invalidateSize();
    fitPositions(map, displayPositions(model.state.waypoints));
  };

  map.on("click", (event) => {
    if (!addPoints.isActive()) {
      return;
    }

    model.insert(model.state.selected + 1, event.latlng.lat, event.latlng.lng);
    addPoints.finish();
  });

  const unsubscribe = model.subscribe(render);
  render(model.state);

  const destroy = () => {
    unsubscribe();
    legs.destroy();
    destroyMap();
  };

  return { fit, destroy };
};
