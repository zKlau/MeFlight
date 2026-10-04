import L from "leaflet";
import { flightData } from "./liveFlightData";
import { createFlightPanel } from "./flightPanel";
import { createFlightTrack } from "./track/flightTrack";
import { AIRCRAFT_MARKER_Z_INDEX_OFFSET } from "./consts/map";
import 'leaflet-rotatedmarker';

let map: L.Map;
let followAircraft: boolean = true;

const leafletMap = () => {
  map = L.map("map").setView(flightData?.getPosition(), 13);
  var mapLink = '<a href="http://www.esri.com/">Esri</a>';
  var wholink =
    "i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community";

  L.tileLayer(
    "http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution: "&copy; " + mapLink + ", " + wholink,
      maxZoom: 18,
    },
  ).addTo(map);
};

export const MapSetup = () => {
  leafletMap();

  var iconOptions: L.IconOptions = {
    iconUrl: "/plane.png",
    iconSize: [64, 64],
  };

  var customIcon = L.icon(iconOptions);

  var markerOptions = {
    clickable: false,
    draggable: false,
    icon: customIcon,
    rotationAngle: 0,
    rotationOrigin: "center",
    zIndexOffset: AIRCRAFT_MARKER_Z_INDEX_OFFSET,
  };

  const marker = L.marker(flightData.getPosition(), markerOptions).addTo(map);
  const flightTrack = createFlightTrack(map);

  const setFollow = (follow: boolean) => {
    followAircraft = follow;
    panel.setFollow(follow);

    if (follow) {
      map.panTo(flightData.getPosition());
    }
  };

  const panel = createFlightPanel(map, flightTrack, setFollow);
  flightTrack.onStatsChange(panel.setStats);
  map.on("dragstart", () => setFollow(false));

  let trackLoaded = false;
  flightTrack.load().finally(() => {
    trackLoaded = true;
  });

  flightData.subscribe((data) => {
    const aircraftPosition = flightData.getPosition();

    marker.setLatLng(aircraftPosition);
    marker.setRotationAngle(flightData.getRotation());

    if (trackLoaded) {
      flightTrack.addLivePoint(data);
    }

    if (followAircraft) {
      map.panTo(aircraftPosition);
    }
  });
};
