import { alignLongitude } from "../editor/geo.js";
import { AIRCRAFT_CLASS, AIRCRAFT_ICON_CLASS, AIRCRAFT_SIZE, AIRCRAFT_SVG, AIRCRAFT_Z_INDEX } from "./liveConsts.js";

export const wholeNumber = (value) => {
  if (typeof value !== "number") {
    return 0;
  }

  return Math.round(value);
};

export const hasAircraftPosition = (status) =>
  Boolean(status) && status.sim_connected && status.latitude !== null && status.longitude !== null;

export const createAircraftMarker = (map) => {
  const icon = L.divIcon({ className: AIRCRAFT_CLASS, html: AIRCRAFT_SVG, iconSize: AIRCRAFT_SIZE });
  const marker = L.marker([0, 0], { icon, interactive: false, keyboard: false, zIndexOffset: AIRCRAFT_Z_INDEX });

  const rotate = (heading) => {
    const element = marker.getElement();

    if (!element) {
      return;
    }

    element.querySelector(`.${AIRCRAFT_ICON_CLASS}`).style.transform = `rotate(${wholeNumber(heading)}deg)`;
  };

  const update = (status) => {
    if (!hasAircraftPosition(status)) {
      marker.remove();
      return null;
    }

    const position = [status.latitude, alignLongitude(status.longitude, map.getCenter().lng)];
    marker.setLatLng(position);

    if (!map.hasLayer(marker)) {
      marker.addTo(map);
    }

    rotate(status.heading);
    return position;
  };

  return { update };
};
