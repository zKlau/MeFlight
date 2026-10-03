import L from "leaflet";
import { flightData } from "./liveFlightData";
import { ONE_SECOND_MS } from "./consts/time";
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
  };

  let marker: L.Marker | null = null;

  setInterval(() => {
    const aircraftPosition = flightData?.getPosition();
    
    if (followAircraft) {
      map.setView(aircraftPosition);
    }

    marker?.remove();

    marker = L.marker(aircraftPosition, {
      ...markerOptions,
      rotationAngle: flightData?.getRotation()
    });


    marker.addTo(map);
  }, ONE_SECOND_MS);
};
