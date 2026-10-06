import { WIDGET_TYPES, type ExtraWidgetType } from "../../consts/widgets";
import type { WidgetParams } from "../params";
import { startAutopilotWidget, startConfigWidget } from "./cockpit";
import { startLandingWidget } from "./landing";
import { startLegWidget } from "./leg";
import { startLocationWidget } from "./location";
import { startLogWidget } from "./log";
import { startOverviewWidget } from "./overview";
import { startPhaseWidget } from "./phase";
import { startProfileWidget } from "./profile";
import { startSessionWidget } from "./session";
import { startTripWidget } from "./trip";
import { startWeatherWidget } from "./weather";

type ExtraWidget = {
  modifier: string;
  start: (root: HTMLElement, params: WidgetParams) => void;
};

const SINGLE = "widget--single";
const CHIPS = "widget--chips";

export const EXTRA_WIDGETS: Record<ExtraWidgetType, ExtraWidget> = {
  [WIDGET_TYPES.location]: { modifier: SINGLE, start: startLocationWidget },
  [WIDGET_TYPES.leg]: { modifier: SINGLE, start: startLegWidget },
  [WIDGET_TYPES.phase]: { modifier: SINGLE, start: startPhaseWidget },
  [WIDGET_TYPES.trip]: { modifier: "widget--strip", start: startTripWidget },
  [WIDGET_TYPES.autopilot]: { modifier: CHIPS, start: startAutopilotWidget },
  [WIDGET_TYPES.config]: { modifier: CHIPS, start: startConfigWidget },
  [WIDGET_TYPES.log]: { modifier: "widget--log", start: startLogWidget },
  [WIDGET_TYPES.profile]: { modifier: "widget--profile", start: startProfileWidget },
  [WIDGET_TYPES.overview]: { modifier: "widget--map", start: startOverviewWidget },
  [WIDGET_TYPES.landing]: { modifier: SINGLE, start: startLandingWidget },
  [WIDGET_TYPES.session]: { modifier: SINGLE, start: startSessionWidget },
  [WIDGET_TYPES.weather]: { modifier: SINGLE, start: startWeatherWidget },
};

const EXTRA_TYPES: string[] = Object.keys(EXTRA_WIDGETS);

export const isExtraWidget = (type: string): type is ExtraWidgetType => EXTRA_TYPES.includes(type);
