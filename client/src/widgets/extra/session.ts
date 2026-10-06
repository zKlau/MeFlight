import { ENDPOINTS } from "../../consts/endpoints";
import { EXTRA_TEXT, SESSION_REFRESH_MS, SESSION_TICK_MS } from "../../consts/extraWidgets";
import { ONE_SECOND_MS } from "../../consts/time";
import { STALE_CLASS, WIDGET_TEXT } from "../../consts/widgets";
import type { SessionResponse } from "../../types";
import { formatDuration } from "../../utils/format";
import type { WidgetParams } from "../params";
import { formatWhole } from "../widgetFormat";
import { createPanel, type Panel } from "./panel";
import { fetchQuietly, startPolling } from "./shared";

const sessionEnd = (session: SessionResponse) => {
  if (session.active || !session.last_seen_at) {
    return Date.now();
  }

  return Date.parse(session.last_seen_at);
};

const render = (root: HTMLElement, panel: Panel, session: SessionResponse | null) => {
  if (!session || !session.started_at) {
    panel.value.textContent = WIDGET_TEXT.empty;
    panel.detail.textContent = EXTRA_TEXT.idle;
    return;
  }

  const elapsedMs = sessionEnd(session) - Date.parse(session.started_at);
  panel.value.textContent = formatDuration(elapsedMs);
  panel.detail.textContent = `${formatWhole(session.distance_nm)} ${WIDGET_TEXT.nauticalMiles} · ${formatDuration(session.airborne_seconds * ONE_SECOND_MS)} ${EXTRA_TEXT.airborne}`;
  root.classList.toggle(STALE_CLASS, !session.active);
};

export const startSessionWidget = (root: HTMLElement, params: WidgetParams) => {
  const panel = createPanel(root, EXTRA_TEXT.session, params.showLabel);
  let session: SessionResponse | null = null;

  startPolling(async () => {
    session = await fetchQuietly<SessionResponse>(ENDPOINTS.session);
    render(root, panel, session);
  }, SESSION_REFRESH_MS);
  setInterval(() => render(root, panel, session), SESSION_TICK_MS);
};
