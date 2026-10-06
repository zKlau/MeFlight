import { EXTRA_TEXT } from "../../consts/extraWidgets";
import { WIDGET_TEXT } from "../../consts/widgets";
import { flightData } from "../../liveFlightData";
import type { AircraftTelemetry } from "../../types";
import { parseAltitude } from "../../utils/format";
import type { WidgetParams } from "../params";
import { formatSigned, formatWhole } from "../widgetFormat";
import { createChipRow, type ChipDefinition } from "./chips";

const GEAR_DOWN = "DOWN";
const PERCENT_SIGN = "%";

const isOn = (value: number | undefined) => Boolean(value);

const AUTOPILOT_CHIPS: ChipDefinition[] = [
  { label: EXTRA_TEXT.autopilot, isActive: (live) => isOn(live.AUTOPILOT_MASTER) },
  { label: EXTRA_TEXT.flightDirector, isActive: (live) => isOn(live.AUTOPILOT_FLIGHT_DIRECTOR_ACTIVE) },
  {
    label: EXTRA_TEXT.heading,
    isActive: (live) => isOn(live.AUTOPILOT_HEADING_LOCK),
    value: (live) => `${formatWhole(live.AUTOPILOT_HEADING_LOCK_DIR)}${WIDGET_TEXT.degrees}`,
  },
  { label: EXTRA_TEXT.nav, isActive: (live) => isOn(live.AUTOPILOT_NAV1_LOCK) },
  { label: EXTRA_TEXT.approach, isActive: (live) => isOn(live.AUTOPILOT_APPROACH_HOLD) },
  {
    label: EXTRA_TEXT.altitude,
    isActive: (live) => isOn(live.AUTOPILOT_ALTITUDE_LOCK),
    value: (live) => formatWhole(parseAltitude(live.AUTOPILOT_ALTITUDE_LOCK_VAR)),
  },
  {
    label: EXTRA_TEXT.verticalSpeed,
    isActive: (live) => isOn(live.AUTOPILOT_VERTICAL_HOLD),
    value: (live) => formatSigned(live.AUTOPILOT_VERTICAL_HOLD_VAR),
  },
  {
    label: EXTRA_TEXT.speed,
    isActive: (live) => isOn(live.AUTOPILOT_AIRSPEED_HOLD),
    value: (live) => `${formatWhole(live.AUTOPILOT_AIRSPEED_HOLD_VAR)} ${WIDGET_TEXT.knots}`,
  },
];

const onOffText = (value: number) => {
  if (value) {
    return EXTRA_TEXT.on;
  }

  return EXTRA_TEXT.off;
};

const gearText = (live: AircraftTelemetry) => {
  if (live.GEAR_HANDLE_POSITION === GEAR_DOWN) {
    return EXTRA_TEXT.gearDown;
  }

  return EXTRA_TEXT.gearUp;
};

const CONFIG_CHIPS: ChipDefinition[] = [
  { label: EXTRA_TEXT.gear, isActive: (live) => live.GEAR_HANDLE_POSITION === GEAR_DOWN, value: gearText },
  { label: EXTRA_TEXT.flaps, isActive: (live) => live.FLAPS_HANDLE_PERCENT > 0, value: (live) => `${formatWhole(live.FLAPS_HANDLE_PERCENT)}${PERCENT_SIGN}` },
  { label: EXTRA_TEXT.trim, isActive: (live) => live.ELEVATOR_TRIM_PCT !== 0, value: (live) => `${formatSigned(live.ELEVATOR_TRIM_PCT)}${PERCENT_SIGN}` },
  { label: EXTRA_TEXT.seatbelts, isActive: (live) => isOn(live.CABIN_SEATBELTS_ALERT_SWITCH), value: (live) => onOffText(live.CABIN_SEATBELTS_ALERT_SWITCH) },
];

const startChipWidget = (root: HTMLElement, definitions: ChipDefinition[]) => {
  const update = createChipRow(root, definitions);
  flightData.subscribe(update);
  flightData.startFetch();
};

export const startAutopilotWidget = (root: HTMLElement, _params: WidgetParams) => startChipWidget(root, AUTOPILOT_CHIPS);

export const startConfigWidget = (root: HTMLElement, _params: WidgetParams) => startChipWidget(root, CONFIG_CHIPS);
