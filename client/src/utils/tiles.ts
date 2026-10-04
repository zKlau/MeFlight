import L from "leaflet";

const SATELLITE_TILE_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const SATELLITE_ATTRIBUTION =
  '&copy; <a href="https://www.esri.com/">Esri</a>, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
const SATELLITE_MAX_ZOOM = 18;

export const addSatelliteTiles = (map: L.Map) =>
  L.tileLayer(SATELLITE_TILE_URL, {
    attribution: SATELLITE_ATTRIBUTION,
    maxZoom: SATELLITE_MAX_ZOOM,
  }).addTo(map);

const PLACE_LABELS_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";

export const addPlaceLabels = (map: L.Map) =>
  L.tileLayer(PLACE_LABELS_URL, { maxZoom: SATELLITE_MAX_ZOOM }).addTo(map);
