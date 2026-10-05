import type L from "leaflet";
import { CLOSE_ICON, MENU_ICON } from "../consts/icons";
import {
  DRAWER_BACKDROP_CLASS,
  DRAWER_CLOSE_CLASS,
  DRAWER_OPEN_CLASS,
  ESCAPE_KEY,
  MENU_BUTTON_CLASS,
  SIDEBAR_SELECTOR,
} from "../consts/layout";
import { UI_TEXT } from "../consts/messages";
import { onSelectionChange } from "../selection";
import { createMapButton } from "./mapButton";

export const createMobileDrawer = (map: L.Map) => {
  const backdrop = document.createElement("div");
  backdrop.className = DRAWER_BACKDROP_CLASS;
  document.body.append(backdrop);

  const close = () => {
    document.body.classList.remove(DRAWER_OPEN_CLASS);
  };

  const toggle = () => {
    document.body.classList.toggle(DRAWER_OPEN_CLASS);
  };

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = DRAWER_CLOSE_CLASS;
  closeButton.innerHTML = CLOSE_ICON;
  closeButton.setAttribute("aria-label", UI_TEXT.closeMenu);
  const sidebar = document.querySelector(SIDEBAR_SELECTOR);

  if (sidebar) {
    sidebar.prepend(closeButton);
  }

  createMapButton(map, MENU_BUTTON_CLASS, MENU_ICON, UI_TEXT.openMenu, toggle);
  backdrop.addEventListener("click", close);
  closeButton.addEventListener("click", close);
  onSelectionChange(close);

  document.addEventListener("keydown", (event) => {
    if (event.key === ESCAPE_KEY) {
      close();
    }
  });
};
