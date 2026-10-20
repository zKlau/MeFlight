import { byId } from "../dom.js";
import { readFollow, storeFollow } from "./followPreference.js";
import { LIVE_PANEL_ID } from "./liveConsts.js";
import { mountLiveView } from "./liveView.js";

export const bindLiveMap = () => {
  const container = byId("live-map");
  const followInput = byId("live-follow");
  const statusLine = byId("live-status");
  let view = null;

  followInput.checked = readFollow();
  followInput.addEventListener("change", () => storeFollow(followInput.checked));

  const mount = () => {
    if (view) {
      return;
    }

    view = mountLiveView(container, followInput, statusLine);
  };

  const unmount = () => {
    if (!view) {
      return;
    }

    view.destroy();
    view = null;
    statusLine.textContent = "";
  };

  return { panelId: LIVE_PANEL_ID, mount, unmount };
};
