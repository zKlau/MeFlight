import L from "leaflet";
import { MAP_BUTTON_CLASS, MAP_BUTTON_POSITION } from "../consts/layout";

export type MapButton = {
  setIcon: (icon: string, label: string) => void;
};

export const createMapButton = (
  map: L.Map,
  modifierClass: string,
  icon: string,
  label: string,
  onClick: () => void,
): MapButton => {
  const button = L.DomUtil.create("button", `${MAP_BUTTON_CLASS} ${modifierClass}`) as HTMLButtonElement;
  button.type = "button";

  const setIcon = (nextIcon: string, nextLabel: string) => {
    button.innerHTML = nextIcon;
    button.title = nextLabel;
    button.setAttribute("aria-label", nextLabel);
  };

  setIcon(icon, label);
  L.DomEvent.disableClickPropagation(button);
  button.addEventListener("click", onClick);

  const control = new L.Control({ position: MAP_BUTTON_POSITION });
  control.onAdd = () => button;
  control.addTo(map);

  return { setIcon };
};
