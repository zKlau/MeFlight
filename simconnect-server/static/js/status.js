import { postJson, request } from "./api.js";
import { ENDPOINTS, FREE_FLIGHT_VALUE, LABELS, TEXT } from "./consts.js";
import { byId, renderDefinitionList, setPill } from "./dom.js";
import { formatDateTime, formatPosition, orDash, orEmpty } from "./format.js";
import { getSelectedPlanId } from "./state.js";

const simPill = byId("sim-pill");
const recordingPill = byId("recording-pill");
const liveStats = byId("live-stats");
const statusError = byId("status-error");
const planSelect = byId("plan-select");
const startButton = byId("start-button");
const stopButton = byId("stop-button");

const groundState = (onGround) => {
  if (onGround === null) {
    return null;
  }

  if (onGround) {
    return TEXT.onGround;
  }

  return TEXT.airborne;
};

const lastPush = (status) => {
  if (!status.last_push_at) {
    return null;
  }

  return formatDateTime(status.last_push_at);
};

const renderPills = (status) => {
  if (status.sim_connected) {
    setPill(simPill, TEXT.simConnected, "ok");
  } else {
    setPill(simPill, TEXT.simWaiting, "warn");
  }

  if (status.recording) {
    setPill(recordingPill, TEXT.recording, "live");
  } else {
    setPill(recordingPill, TEXT.idle);
  }
};

const render = (status) => {
  renderPills(status);
  renderDefinitionList(liveStats, [
    [LABELS.position, formatPosition(status.latitude, status.longitude)],
    [LABELS.altitude, `${orDash(status.altitude)} ${LABELS.feet}`],
    [LABELS.fuel, `${orDash(status.fuel_percentage)}%`],
    [LABELS.state, orDash(groundState(status.on_ground))],
    [LABELS.pointsSent, String(status.pushed_count)],
    [LABELS.lastSent, orDash(lastPush(status))],
  ]);
  statusError.textContent = orEmpty(status.last_error);
  startButton.disabled = status.recording;
  stopButton.disabled = !status.recording;
  planSelect.disabled = status.recording;
};

const selectedPlanOrNull = () => {
  const planId = getSelectedPlanId();

  if (planId === FREE_FLIGHT_VALUE) {
    return null;
  }

  return planId;
};

export const refreshStatus = async () => {
  try {
    render(await request(ENDPOINTS.status));
  } catch (error) {
    statusError.textContent = error.message;
  }
};

export const bindRecordingButtons = () => {
  startButton.addEventListener("click", async () => {
    render(await postJson(ENDPOINTS.startRecording, { flightplan_id: selectedPlanOrNull() }));
  });

  stopButton.addEventListener("click", async () => {
    render(await postJson(ENDPOINTS.stopRecording, {}));
  });
};
