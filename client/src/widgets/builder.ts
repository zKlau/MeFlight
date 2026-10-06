import "../styles/builder.css";
import { fetchJson } from "../apiService";
import { ENDPOINTS } from "../consts/endpoints";
import { LOG_MESSAGES } from "../consts/messages";
import {
  COPIED_FEEDBACK_MS,
  WIDE_WIDGET_MIN_WIDTH,
  FOLLOW_LIVE_PLAN,
  WIDGET_PAGE,
  WIDGET_TEXT,
} from "../consts/widgets";
import { WIDGET_CATALOG, type WidgetCatalogEntry } from "../consts/widgetCatalog";
import { element } from "../sidebar/dom";
import type { FlightPlanSummary } from "../types";
import { planTitle } from "../utils/format";
import { buildWidgetQuery } from "./params";

const elementById = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const planSelect = elementById<HTMLSelectElement>("plan-select");
const panelToggle = elementById<HTMLInputElement>("panel-toggle");
const labelToggle = elementById<HTMLInputElement>("label-toggle");
const widgetList = elementById<HTMLElement>("widget-list");

const option = (value: string, text: string) => {
  const node = element("option", "", text);
  node.value = value;
  return node;
};

const widgetUrl = (entry: WidgetCatalogEntry) => {
  const query = buildWidgetQuery(entry.type, planSelect.value, panelToggle.checked, labelToggle.checked);
  return new URL(`${WIDGET_PAGE}?${query}`, location.href).toString();
};

const copyButton = (input: HTMLInputElement) => {
  const button = element("button", "button", WIDGET_TEXT.copy);
  button.type = "button";
  button.addEventListener("click", async () => {
    await navigator.clipboard.writeText(input.value);
    button.textContent = WIDGET_TEXT.copied;
    setTimeout(() => {
      button.textContent = WIDGET_TEXT.copy;
    }, COPIED_FEEDBACK_MS);
  });
  return button;
};

const fitPreview = (container: HTMLElement, frame: HTMLIFrameElement, entry: WidgetCatalogEntry) => {
  const scale = Math.min(1, container.clientWidth / entry.width);
  frame.style.transform = `scale(${scale})`;
  container.style.height = `${entry.height * scale}px`;
};

const preview = (entry: WidgetCatalogEntry, url: string) => {
  const container = element("div", "builder__preview");
  const frame = element("iframe", "builder__frame");
  frame.src = url;
  frame.width = String(entry.width);
  frame.height = String(entry.height);
  frame.title = entry.title;
  container.append(frame);
  new ResizeObserver(() => fitPreview(container, frame, entry)).observe(container);
  return container;
};

const widgetCard = (entry: WidgetCatalogEntry) => {
  const url = widgetUrl(entry);
  const card = element("article", "builder__card");
  const input = element("input", "builder__url");
  const urlRow = element("div", "builder__url-row");

  card.classList.toggle("builder__card--wide", entry.width >= WIDE_WIDGET_MIN_WIDTH);
  input.readOnly = true;
  input.value = url;
  urlRow.append(input, copyButton(input));
  card.append(
    element("h2", "", entry.title),
    element("p", "muted", entry.description),
    element("p", "builder__size", `${WIDGET_TEXT.size}: ${entry.width} × ${entry.height}`),
    preview(entry, url),
    urlRow,
  );
  return card;
};

const render = () => {
  widgetList.replaceChildren(...WIDGET_CATALOG.map(widgetCard));
};

const loadPlans = async () => {
  try {
    const plans = await fetchJson<FlightPlanSummary[]>(ENDPOINTS.flightPlans);
    planSelect.append(...plans.map((plan) => option(plan.id, planTitle(plan))));
  } catch (error) {
    console.warn(LOG_MESSAGES.plansFetchFailed, error);
  }
};

planSelect.append(option(FOLLOW_LIVE_PLAN, WIDGET_TEXT.livePlan));
[planSelect, panelToggle, labelToggle].forEach((control) => control.addEventListener("change", render));
render();
loadPlans();
