import { EXTRA_TEXT, PHASES, type Phase } from "../../consts/extraWidgets";
import { WIDGET_TEXT } from "../../consts/widgets";
import { flightData } from "../../liveFlightData";
import { isUnplacedPosition } from "../../track/trackPoint";
import { parseAltitude } from "../../utils/format";
import type { WidgetParams } from "../params";
import { formatSigned, formatWhole } from "../widgetFormat";
import { createPanel } from "./panel";
import { createPhaseDetector } from "./phaseDetector";

const PHASE_TONES: Partial<Record<Phase, string>> = {
  [PHASES.takeoff]: "good",
  [PHASES.landed]: "good",
  [PHASES.approach]: "ok",
};

const toneFor = (phase: Phase) => {
  const tone = PHASE_TONES[phase];

  if (!tone) {
    return null;
  }

  return tone;
};

export const startPhaseWidget = (root: HTMLElement, params: WidgetParams) => {
  const panel = createPanel(root, EXTRA_TEXT.phase, params.showLabel);
  const detect = createPhaseDetector();
  panel.value.textContent = WIDGET_TEXT.empty;

  flightData.subscribe((live) => {
    if (isUnplacedPosition(live)) {
      return;
    }

    const phase = detect(live);
    panel.value.textContent = phase;
    panel.detail.textContent = `${formatWhole(parseAltitude(live.ALTITUDE))} ${WIDGET_TEXT.feet} · ${formatSigned(live.VERTICAL_SPEED)} ${WIDGET_TEXT.feetPerMinute}`;
    panel.setTone(toneFor(phase));
  });
  flightData.startFetch();
};
