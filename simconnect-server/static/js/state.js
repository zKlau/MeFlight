import { FREE_FLIGHT_VALUE } from "./consts.js";

const listeners = new Set();
let selectedPlanId = FREE_FLIGHT_VALUE;

export const getSelectedPlanId = () => selectedPlanId;

export const selectPlan = (planId) => {
  selectedPlanId = planId;
  listeners.forEach((listener) => listener(planId));
};

export const onPlanSelected = (listener) => {
  listeners.add(listener);
};
