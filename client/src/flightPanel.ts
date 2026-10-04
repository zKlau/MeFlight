import L from "leaflet";
import { FIT_BOUNDS_PADDING_PX, FLIGHT_PANEL_POSITION, PANEL_ROLES } from "./consts/map";
import { UI_TEXT } from "./consts/messages";
import { ALTITUDE_BANDS } from "./consts/track";
import type { FlightTrack } from "./track/flightTrack";
import type { TrackStats } from "./types";
import { formatTrackStats } from "./utils/format";

const checkbox = (role: string, label: string) =>
  `<label><input type="checkbox" data-role="${role}" checked /> ${label}</label>`;

const legend = () =>
  ALTITUDE_BANDS.map(
    (band) => `<div><span style="background:${band.color}"></span>${band.label}</div>`,
  ).join("");

const panelContent = () => `
  <div class="flight-panel__title">${UI_TEXT.mapTitle}</div>
  ${checkbox(PANEL_ROLES.follow, UI_TEXT.followAircraft)}
  ${checkbox(PANEL_ROLES.track, UI_TEXT.flownTrack)}
  ${checkbox(PANEL_ROLES.plan, UI_TEXT.flightPlan)}
  <button type="button" class="button" data-role="${PANEL_ROLES.fit}">${UI_TEXT.showWholeFlight}</button>
  <div class="flight-panel__stats" data-role="${PANEL_ROLES.stats}">${UI_TEXT.noTrack}</div>
  <div class="flight-panel__legend">${legend()}</div>
`;

export const createFlightPanel = (
  map: L.Map,
  flightTrack: FlightTrack,
  onFollowChange: (follow: boolean) => void,
) => {
  const container = L.DomUtil.create("div", "flight-panel");
  container.innerHTML = panelContent();

  const element = <T extends HTMLElement>(role: string) =>
    container.querySelector(`[data-role="${role}"]`) as T;

  const followInput = element<HTMLInputElement>(PANEL_ROLES.follow);
  const statsElement = element<HTMLDivElement>(PANEL_ROLES.stats);

  const bindLayerToggle = (role: string, layer: L.Layer) => {
    const input = element<HTMLInputElement>(role);

    input.addEventListener("change", () => {
      if (input.checked) {
        layer.addTo(map);
        return;
      }

      layer.remove();
    });
  };

  let pendingBounds: L.LatLngBounds | null = null;

  const hasSize = () => {
    const size = map.getSize();
    return size.x > 0 && size.y > 0;
  };

  const applyFit = (bounds: L.LatLngBounds) => {
    map.stop();
    map.fitBounds(bounds, {
      paddingTopLeft: [FIT_BOUNDS_PADDING_PX, FIT_BOUNDS_PADDING_PX],
      paddingBottomRight: [container.offsetWidth + FIT_BOUNDS_PADDING_PX, FIT_BOUNDS_PADDING_PX],
    });
  };

  const fitBounds = (bounds: L.LatLngBounds) => {
    if (!bounds.isValid()) {
      return;
    }

    onFollowChange(false);
    map.invalidateSize();

    if (!hasSize()) {
      pendingBounds = bounds;
      return;
    }

    applyFit(bounds);
  };

  const applyPendingFit = () => {
    if (!pendingBounds || !hasSize()) {
      return;
    }

    const bounds = pendingBounds;
    pendingBounds = null;
    applyFit(bounds);
  };

  map.on("resize", applyPendingFit);

  const fitWholeFlight = () => fitBounds(flightTrack.getBounds());

  followInput.addEventListener("change", () => onFollowChange(followInput.checked));
  bindLayerToggle(PANEL_ROLES.track, flightTrack.trackLayer);
  bindLayerToggle(PANEL_ROLES.plan, flightTrack.planLayer);
  element<HTMLButtonElement>(PANEL_ROLES.fit).addEventListener("click", fitWholeFlight);

  L.DomEvent.disableClickPropagation(container);
  L.DomEvent.disableScrollPropagation(container);

  const control = new L.Control({ position: FLIGHT_PANEL_POSITION });
  control.onAdd = () => container;
  control.addTo(map);

  return {
    fitBounds,
    fitWholeFlight,
    setFollow: (follow: boolean) => {
      followInput.checked = follow;
    },
    setStats: (stats: TrackStats) => {
      statsElement.textContent = formatTrackStats(stats);
    },
  };
};
