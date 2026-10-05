import type L from "leaflet";
import { FULLSCREEN_ENTER_ICON, FULLSCREEN_EXIT_ICON } from "../consts/icons";
import { FULLSCREEN_BUTTON_CLASS } from "../consts/layout";
import { UI_TEXT } from "../consts/messages";
import { createMapButton } from "./mapButton";

const isFullscreen = () => document.fullscreenElement !== null;

const toggleFullscreen = () => {
  if (isFullscreen()) {
    document.exitFullscreen();
    return;
  }

  document.documentElement.requestFullscreen();
};

export const createFullscreenButton = (map: L.Map) => {
  if (!document.fullscreenEnabled) {
    return;
  }

  const button = createMapButton(
    map,
    FULLSCREEN_BUTTON_CLASS,
    FULLSCREEN_ENTER_ICON,
    UI_TEXT.enterFullscreen,
    toggleFullscreen,
  );

  document.addEventListener("fullscreenchange", () => {
    if (isFullscreen()) {
      button.setIcon(FULLSCREEN_EXIT_ICON, UI_TEXT.exitFullscreen);
      return;
    }

    button.setIcon(FULLSCREEN_ENTER_ICON, UI_TEXT.enterFullscreen);
  });
};
