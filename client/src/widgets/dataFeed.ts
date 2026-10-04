import { fetchJson } from "../apiService";
import { ENDPOINTS } from "../consts/endpoints";
import { LOG_MESSAGES } from "../consts/messages";
import { FOLLOW_LIVE_PLAN, WIDGET_PLAN_REFRESH_MS } from "../consts/widgets";
import { flightData } from "../liveFlightData";
import { flightPlanIdOf } from "../track/trackPoint";
import type { AircraftTelemetry, FlightPlanProgress, FlightPlanRouteResponse } from "../types";

export type WidgetContext = {
  live: AircraftTelemetry | null;
  planId: string | null;
  progress: FlightPlanProgress | null;
  route: FlightPlanRouteResponse | null;
};

type ContextListener = (context: WidgetContext) => void;

export const createWidgetFeed = (planParam: string) => {
  const context: WidgetContext = { live: null, planId: null, progress: null, route: null };
  const listeners = new Set<ContextListener>();
  let planLoaded = false;

  const notify = () => listeners.forEach((listener) => listener(context));

  const resolvePlanId = (live: AircraftTelemetry) => {
    if (planParam !== FOLLOW_LIVE_PLAN) {
      return planParam;
    }

    return flightPlanIdOf(live);
  };

  const fetchPlan = async (planId: string) => {
    const [route, progress] = await Promise.all([
      fetchJson<FlightPlanRouteResponse>(ENDPOINTS.flightPlanRoute(planId)),
      fetchJson<FlightPlanProgress>(ENDPOINTS.flightPlanProgress(planId)),
    ]);

    if (planId === context.planId) {
      context.route = route;
      context.progress = progress;
      notify();
    }
  };

  const loadPlan = async (planId: string | null) => {
    if (planLoaded && planId === context.planId) {
      return;
    }

    planLoaded = true;
    context.planId = planId;
    context.route = null;
    context.progress = null;

    if (!planId) {
      notify();
      return;
    }

    try {
      await fetchPlan(planId);
    } catch (error) {
      console.warn(LOG_MESSAGES.progressFetchFailed, error);
    }
  };

  const refreshProgress = async () => {
    if (!context.planId) {
      return;
    }

    try {
      context.progress = await fetchJson<FlightPlanProgress>(ENDPOINTS.flightPlanProgress(context.planId));
      notify();
    } catch (error) {
      console.warn(LOG_MESSAGES.progressFetchFailed, error);
    }
  };

  const onLive = (live: AircraftTelemetry) => {
    context.live = live;
    loadPlan(resolvePlanId(live));
    notify();
  };

  const subscribe = (listener: ContextListener) => {
    listeners.add(listener);
  };

  const start = () => {
    flightData.subscribe(onLive);
    flightData.startFetch();
    setInterval(refreshProgress, WIDGET_PLAN_REFRESH_MS);
  };

  return { start, subscribe };
};
