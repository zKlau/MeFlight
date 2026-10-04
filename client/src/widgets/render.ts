import { PANEL_CLASS, STALE_CLASS } from "../consts/widgets";
import { element } from "../sidebar/dom";
import { isLiveTelemetryFresh } from "../utils/liveness";
import type { WidgetContext } from "./dataFeed";
import type { WidgetParams } from "./params";
import type { WidgetView } from "./valueWidgets";

const PERCENT = 100;

type WidgetElements = {
  label: HTMLElement;
  value: HTMLElement;
  detail: HTMLElement;
  fill: HTMLElement;
  bar: HTMLElement;
};

const createWidgetElements = (container: HTMLElement, showLabel: boolean): WidgetElements => {
  const elements = {
    label: element("div", "widget__label"),
    value: element("div", "widget__value"),
    detail: element("div", "widget__detail"),
    bar: element("div", "widget__bar"),
    fill: element("div", "widget__bar-fill"),
  };

  elements.bar.append(elements.fill);
  elements.label.hidden = !showLabel;
  container.append(elements.label, elements.value, elements.detail, elements.bar);
  return elements;
};

const widthPercent = (fraction: number | null) => {
  if (fraction === null) {
    return 0;
  }

  return Math.min(PERCENT, Math.max(0, fraction * PERCENT));
};

const updateWidgetElements = (elements: WidgetElements, view: WidgetView) => {
  elements.label.textContent = view.label;
  elements.value.textContent = view.value;
  elements.detail.textContent = view.detail;
  elements.bar.hidden = view.fraction === null;
  elements.fill.style.width = `${widthPercent(view.fraction)}%`;
};

const isStale = (context: WidgetContext) => context.live === null || !isLiveTelemetryFresh(context.live);

export const prepareRoot = (root: HTMLElement, params: WidgetParams, modifier: string) => {
  root.classList.add("widget", modifier);
  root.classList.toggle(PANEL_CLASS, params.showPanel);
};

export const createWidgetRenderer = (root: HTMLElement, params: WidgetParams, renderViews: (context: WidgetContext) => WidgetView[], count: number) => {
  const items = Array.from({ length: count }, () => {
    const item = element("div", "widget__item");
    root.append(item);
    return createWidgetElements(item, params.showLabel);
  });

  return (context: WidgetContext) => {
    const views = renderViews(context);
    items.forEach((elements, index) => updateWidgetElements(elements, views[index]));
    root.classList.toggle(STALE_CLASS, isStale(context));
  };
};
