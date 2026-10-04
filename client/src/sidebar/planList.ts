import { fetchJson } from "../apiService";
import { ENDPOINTS } from "../consts/endpoints";
import { SIDEBAR_TEXT } from "../consts/sidebar";
import { getSelection, LATEST_FLIGHT, onSelectionChange, select } from "../selection";
import type { FlightPlanSummary } from "../types";
import { formatRoute, planTitle } from "../utils/format";
import { element } from "./dom";

const SELECTED_CLASS = "selected";

export const createPlanList = (container: HTMLElement) => {
  let plans: FlightPlanSummary[] = [];

  const item = (selection: string, title: string, subtitle: string) => {
    const button = element("button", "plan-entry");
    button.type = "button";
    button.append(element("strong", "", title), element("span", "plan-entry__meta", subtitle));
    button.addEventListener("click", () => select(selection));

    if (selection === getSelection()) {
      button.classList.add(SELECTED_CLASS);
    }

    const listItem = element("li");
    listItem.append(button);
    return listItem;
  };

  const planItem = (plan: FlightPlanSummary) =>
    item(plan.id, planTitle(plan), `${formatRoute(plan)} · ${plan.total_waypoints} ${SIDEBAR_TEXT.waypoints}`);

  const emptyHint = () => {
    if (plans.length > 0) {
      return [];
    }

    return [element("li", "muted", SIDEBAR_TEXT.noPlans)];
  };

  const render = () => {
    container.replaceChildren(
      item(LATEST_FLIGHT, SIDEBAR_TEXT.latestFlight, SIDEBAR_TEXT.latestFlightHint),
      ...plans.map(planItem),
      ...emptyHint(),
    );
  };

  const load = async () => {
    plans = await fetchJson<FlightPlanSummary[]>(ENDPOINTS.flightPlans);
    render();
  };

  const findPlan = (id: string) => plans.find((plan) => plan.id === id);

  onSelectionChange(render);

  return { load, findPlan };
};

export type PlanList = ReturnType<typeof createPlanList>;
