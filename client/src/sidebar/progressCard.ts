import { fetchJson, fetchOptionalJson } from "../apiService";
import { ENDPOINTS } from "../consts/endpoints";
import { LOG_MESSAGES } from "../consts/messages";
import { isPlanSelection } from "../selection";
import type { FlightPlanProgress, LastState } from "../types";
import type { PlanList } from "./planList";
import { errorView, latestFlightView, progressView } from "./progressView";

export type PlanDetails = {
  progress: FlightPlanProgress;
  lastState: LastState | null;
};

export const createProgressCard = (container: HTMLElement, planList: PlanList) => {
  let requestedSelection = "";

  const fetchDetails = async (planId: string): Promise<PlanDetails> => {
    const [progress, lastState] = await Promise.all([
      fetchJson<FlightPlanProgress>(ENDPOINTS.flightPlanProgress(planId)),
      fetchOptionalJson<LastState>(ENDPOINTS.flightPlanLastState(planId)),
    ]);
    return { progress, lastState };
  };

  const showPlan = async (planId: string): Promise<PlanDetails | null> => {
    const plan = planList.findPlan(planId);

    try {
      const details = await fetchDetails(planId);

      if (requestedSelection !== planId || !plan) {
        return null;
      }

      container.replaceChildren(...progressView(plan, details.progress, details.lastState));
      return details;
    } catch (error) {
      console.warn(LOG_MESSAGES.progressFetchFailed, error);
      container.replaceChildren(...errorView());
      return null;
    }
  };

  const show = async (selection: string) => {
    requestedSelection = selection;

    if (!isPlanSelection(selection)) {
      container.replaceChildren(...latestFlightView());
      return null;
    }

    return showPlan(selection);
  };

  return { show };
};
