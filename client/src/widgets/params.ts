import {
  DEFAULT_MAP_ZOOM,
  FOLLOW_LIVE_PLAN,
  MAX_MAP_ZOOM,
  MIN_MAP_ZOOM,
  PARAM_OFF,
  WIDGET_PARAMS,
  WIDGET_TYPES,
  type WidgetType,
} from "../consts/widgets";

export type WidgetParams = {
  type: WidgetType | null;
  plan: string;
  showPanel: boolean;
  showLabel: boolean;
  zoom: number;
};

const WIDGET_TYPE_VALUES: string[] = Object.values(WIDGET_TYPES);

const isWidgetType = (value: string | null): value is WidgetType =>
  value !== null && WIDGET_TYPE_VALUES.includes(value);

const readType = (params: URLSearchParams) => {
  const value = params.get(WIDGET_PARAMS.type);

  if (!isWidgetType(value)) {
    return null;
  }

  return value;
};

const readPlan = (params: URLSearchParams) => {
  const value = params.get(WIDGET_PARAMS.plan);

  if (!value) {
    return FOLLOW_LIVE_PLAN;
  }

  return value;
};

const readZoom = (params: URLSearchParams) => {
  const value = Number(params.get(WIDGET_PARAMS.zoom));

  if (!Number.isFinite(value) || value === 0) {
    return DEFAULT_MAP_ZOOM;
  }

  return Math.min(MAX_MAP_ZOOM, Math.max(MIN_MAP_ZOOM, value));
};

export const readWidgetParams = (search: string): WidgetParams => {
  const params = new URLSearchParams(search);

  return {
    type: readType(params),
    plan: readPlan(params),
    showPanel: params.get(WIDGET_PARAMS.panel) !== PARAM_OFF,
    showLabel: params.get(WIDGET_PARAMS.label) !== PARAM_OFF,
    zoom: readZoom(params),
  };
};

export const buildWidgetQuery = (type: WidgetType, plan: string, showPanel: boolean, showLabel: boolean) => {
  const params = new URLSearchParams({ [WIDGET_PARAMS.type]: type });

  if (plan !== FOLLOW_LIVE_PLAN) {
    params.set(WIDGET_PARAMS.plan, plan);
  }

  if (!showPanel) {
    params.set(WIDGET_PARAMS.panel, PARAM_OFF);
  }

  if (!showLabel) {
    params.set(WIDGET_PARAMS.label, PARAM_OFF);
  }

  return params.toString();
};
