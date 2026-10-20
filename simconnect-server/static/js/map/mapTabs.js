import { byId } from "../dom.js";
import { ACTIVE_TAB_CLASS, MAP_TAB_STORAGE_KEY, MAP_TABS } from "./mapConsts.js";

const readStoredTab = () => {
  try {
    return localStorage.getItem(MAP_TAB_STORAGE_KEY);
  } catch {
    return null;
  }
};

const storeTab = (tab) => {
  try {
    localStorage.setItem(MAP_TAB_STORAGE_KEY, tab);
  } catch {
    return;
  }
};

const initialTab = (views) => {
  const stored = readStoredTab();

  if (stored && views[stored]) {
    return stored;
  }

  return MAP_TABS.live;
};

export const bindMapTabs = (views) => {
  const buttons = [...document.querySelectorAll("[data-map-tab]")];
  let active = null;

  const show = (tab) => {
    if (tab === active) {
      return;
    }

    if (active) {
      views[active].unmount();
      byId(views[active].panelId).hidden = true;
    }

    active = tab;
    storeTab(tab);
    buttons.forEach((button) => {
      const selected = button.dataset.mapTab === tab;
      button.classList.toggle(ACTIVE_TAB_CLASS, selected);
      button.setAttribute("aria-selected", String(selected));
    });
    byId(views[tab].panelId).hidden = false;
    views[tab].mount();
  };

  buttons.forEach((button) => button.addEventListener("click", () => show(button.dataset.mapTab)));
  show(initialTab(views));
};
