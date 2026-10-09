import { request } from "../api.js";
import { FREE_FLIGHT_VALUE } from "../consts.js";
import { byId } from "../dom.js";
import { getSelectedPlanId, onPlanSelected } from "../state.js";
import { EDITOR_ENDPOINTS, EDITOR_TEXT } from "./editorConsts.js";
import { createEditorForm } from "./editorForm.js";
import { createEditorList } from "./editorList.js";
import { createEditorMap } from "./editorMap.js";
import { normalizeLongitude } from "./geo.js";
import { createRouteModel } from "./routeModel.js";

const status = byId("editor-status");
const hint = byId("editor-hint");
const body = byId("editor-body");
const saveButton = byId("editor-save");
const discardButton = byId("editor-discard");
const addButton = byId("editor-add");

const toPayload = (waypoints) => ({
  waypoints: waypoints.map((waypoint) => ({ ...waypoint, longitude: normalizeLongitude(waypoint.longitude) })),
});

export const bindEditor = () => {
  const model = createRouteModel();
  const map = createEditorMap(byId("editor-map"), model);
  createEditorList(byId("editor-list"), model);
  createEditorForm(byId("editor-form"), model, (message) => {
    status.textContent = message;
  });

  const showPlan = (hasPlan) => {
    body.hidden = !hasPlan;
    addButton.disabled = !hasPlan;

    if (hasPlan) {
      hint.textContent = EDITOR_TEXT.hint;
      return;
    }

    hint.textContent = EDITOR_TEXT.noPlan;
  };

  const load = async (planId) => {
    map.setAddMode(false);

    if (planId === FREE_FLIGHT_VALUE) {
      model.clear();
      showPlan(false);
      return;
    }

    status.textContent = EDITOR_TEXT.loading;
    showPlan(true);

    try {
      const plan = await request(EDITOR_ENDPOINTS.plan(planId));
      model.load(planId, plan.waypoints);
      map.fit();
      status.textContent = "";
    } catch (error) {
      status.textContent = error.message;
    }
  };

  const save = async () => {
    status.textContent = EDITOR_TEXT.saving;

    try {
      const plan = await request(EDITOR_ENDPOINTS.waypoints(model.state.planId), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(model.state.waypoints)),
      });
      model.load(model.state.planId, plan.waypoints);
      status.textContent = EDITOR_TEXT.saved;
    } catch (error) {
      status.textContent = error.message;
    }
  };

  const discard = () => {
    if (window.confirm(EDITOR_TEXT.confirmDiscard)) {
      load(model.state.planId);
    }
  };

  const changePlan = (planId) => {
    if (model.state.dirty && !window.confirm(EDITOR_TEXT.confirmLeave)) {
      return;
    }

    load(planId);
  };

  model.subscribe((state) => {
    saveButton.disabled = !state.dirty;
    discardButton.disabled = !state.dirty;

    if (state.dirty) {
      status.textContent = EDITOR_TEXT.unsaved;
    }
  });

  map.onAddModeChange((enabled) => {
    if (enabled) {
      addButton.textContent = EDITOR_TEXT.cancelAdd;
      hint.textContent = EDITOR_TEXT.addMode;
      return;
    }

    addButton.textContent = EDITOR_TEXT.addOnMap;
    hint.textContent = EDITOR_TEXT.hint;
  });

  addButton.addEventListener("click", () => map.setAddMode(!map.isAddMode()));
  saveButton.addEventListener("click", save);
  discardButton.addEventListener("click", discard);
  onPlanSelected(changePlan);
  load(getSelectedPlanId());
};
