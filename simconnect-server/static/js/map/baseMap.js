import { DEFAULT_VIEW, FIT_PADDING_PX, LABELS_URL, MAX_ZOOM, TILE_ATTRIBUTION, TILE_URL } from "./mapConsts.js";

export const fitPositions = (map, positions) => {
  if (positions.length === 0) {
    return;
  }

  map.fitBounds(L.latLngBounds(positions), { padding: [FIT_PADDING_PX, FIT_PADDING_PX] });
};

export const createBaseMap = (container) => {
  const map = L.map(container).setView(DEFAULT_VIEW.center, DEFAULT_VIEW.zoom);
  L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: MAX_ZOOM }).addTo(map);
  L.tileLayer(LABELS_URL, { maxZoom: MAX_ZOOM }).addTo(map);

  const observer = new ResizeObserver(() => map.invalidateSize());
  observer.observe(container);

  const destroy = () => {
    observer.disconnect();
    map.remove();
  };

  return { map, destroy };
};
