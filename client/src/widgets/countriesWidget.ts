import { fetchJson } from "../apiService";
import { ENDPOINTS } from "../consts/endpoints";
import { LOG_MESSAGES } from "../consts/messages";
import { FOLLOW_LIVE_PLAN, WIDGET_PLAN_REFRESH_MS, WIDGET_TEXT } from "../consts/widgets";
import { flightData } from "../liveFlightData";
import { element } from "../sidebar/dom";
import { flagImage } from "../utils/flags";
import { flightPlanIdOf } from "../track/trackPoint";
import type { CountriesResponse } from "../types";
import type { WidgetParams } from "./params";

type CountriesElements = {
  label: HTMLElement;
  value: HTMLElement;
  detail: HTMLElement;
  flags: HTMLElement;
};

const createElements = (root: HTMLElement, label: string, showLabel: boolean): CountriesElements => {
  const elements = {
    label: element("div", "widget__label", label),
    value: element("div", "widget__value"),
    detail: element("div", "widget__detail"),
    flags: element("div", "widget__flags"),
  };

  elements.label.hidden = !showLabel;
  root.append(elements.label, elements.value, elements.detail, elements.flags);
  return elements;
};

const showEmpty = (elements: CountriesElements) => {
  elements.value.textContent = WIDGET_TEXT.empty;
  elements.detail.textContent = WIDGET_TEXT.noPlan;
  elements.flags.replaceChildren();
};

const showCountries = (elements: CountriesElements, response: CountriesResponse) => {
  elements.value.textContent = String(response.total);
  elements.detail.textContent = `${response.landed} ${WIDGET_TEXT.landed} · ${response.flown_over} ${WIDGET_TEXT.flownOver}`;
  elements.flags.replaceChildren(...[...response.countries].reverse().map((country) => flagImage(country, "widget__flag")));
};

const labelFor = (allTime: boolean) => {
  if (allTime) {
    return WIDGET_TEXT.countriesAllTime;
  }

  return WIDGET_TEXT.countries;
};

export const startCountriesWidget = (root: HTMLElement, params: WidgetParams, allTime: boolean) => {
  const elements = createElements(root, labelFor(allTime), params.showLabel);
  let planId: string | null = null;

  const endpoint = () => {
    if (allTime) {
      return ENDPOINTS.countries;
    }

    if (!planId) {
      return null;
    }

    return ENDPOINTS.flightPlanCountries(planId);
  };

  const refresh = async () => {
    const path = endpoint();

    if (!path) {
      showEmpty(elements);
      return;
    }

    try {
      showCountries(elements, await fetchJson<CountriesResponse>(path));
    } catch (error) {
      console.warn(LOG_MESSAGES.countriesFetchFailed, error);
    }
  };

  const followLivePlan = () => {
    flightData.subscribe((live) => {
      const livePlanId = flightPlanIdOf(live);

      if (livePlanId !== planId) {
        planId = livePlanId;
        refresh();
      }
    });
    flightData.startFetch();
  };

  if (!allTime && params.plan === FOLLOW_LIVE_PLAN) {
    followLivePlan();
  }

  if (!allTime && params.plan !== FOLLOW_LIVE_PLAN) {
    planId = params.plan;
  }

  refresh();
  setInterval(refresh, WIDGET_PLAN_REFRESH_MS);
};
