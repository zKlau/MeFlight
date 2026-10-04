import { request } from "./api.js";
import { ENDPOINTS, FREE_FLIGHT_VALUE, TEXT } from "./consts.js";
import { byId, element } from "./dom.js";
import { planRoute } from "./format.js";
import { getSelectedPlanId, onPlanSelected, selectPlan } from "./state.js";

const planSelect = byId("plan-select");
const planList = byId("plan-list");
const plnInput = byId("pln-input");
const uploadButton = byId("upload-button");
const uploadResult = byId("upload-result");

let plans = [];

const option = (value, label) => {
  const node = element("option", "", label);
  node.value = value;
  return node;
};

const renderSelect = () => {
  planSelect.replaceChildren(
    option(FREE_FLIGHT_VALUE, TEXT.freeFlight),
    ...plans.map((plan) => option(plan.id, `${plan.title} (${planRoute(plan)})`)),
  );
  planSelect.value = getSelectedPlanId();
};

const deletePlan = async (plan) => {
  if (!window.confirm(TEXT.confirmDelete)) {
    return;
  }

  await request(ENDPOINTS.plan(plan.id), { method: "DELETE" });

  if (getSelectedPlanId() === plan.id) {
    selectPlan(FREE_FLIGHT_VALUE);
  }

  await loadPlans();
};

const planItem = (plan) => {
  const item = element("li", "plan-item");
  const info = element("div");
  const actions = element("div", "actions");
  const selectButton = element("button", "", TEXT.select);
  const deleteButton = element("button", "danger", TEXT.delete);

  info.append(
    element("strong", "", plan.title),
    element("div", "plan-item__meta", `${planRoute(plan)} · ${plan.total_waypoints} ${TEXT.waypoints}`),
  );
  selectButton.addEventListener("click", () => selectPlan(plan.id));
  deleteButton.addEventListener("click", () => deletePlan(plan));
  actions.append(selectButton, deleteButton);
  item.append(info, actions);

  if (plan.id === getSelectedPlanId()) {
    item.classList.add("selected");
  }

  return item;
};

const renderList = () => {
  if (plans.length === 0) {
    planList.replaceChildren(element("li", "muted", TEXT.noPlans));
    return;
  }

  planList.replaceChildren(...plans.map(planItem));
};

const render = () => {
  renderSelect();
  renderList();
};

export const loadPlans = async () => {
  plans = await request(ENDPOINTS.plans);
  render();
};

const uploadPlan = async () => {
  const file = plnInput.files[0];

  if (!file) {
    uploadResult.textContent = TEXT.chooseFile;
    return;
  }

  uploadResult.textContent = TEXT.uploading;

  try {
    const plan = await request(ENDPOINTS.upload, {
      method: "POST",
      headers: { "Content-Type": "application/xml" },
      body: await file.text(),
    });
    uploadResult.textContent = `${TEXT.uploaded}: ${plan.title} (${plan.total_waypoints} ${TEXT.waypoints})`;
    plnInput.value = "";
    await loadPlans();
    selectPlan(plan.id);
  } catch (error) {
    uploadResult.textContent = error.message;
  }
};

export const bindPlans = () => {
  planSelect.addEventListener("change", () => selectPlan(planSelect.value));
  uploadButton.addEventListener("click", uploadPlan);
  onPlanSelected(render);
};
