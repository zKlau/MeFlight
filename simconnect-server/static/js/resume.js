import { request } from "./api.js";
import { ENDPOINTS, FREE_FLIGHT_VALUE, LABELS, TEXT } from "./consts.js";
import { byId, element, renderDefinitionList } from "./dom.js";
import { formatDateTime, formatDuration, formatNm, formatPercent, formatPosition, tankName } from "./format.js";
import { getSelectedPlanId, onPlanSelected } from "./state.js";

const hint = byId("resume-hint");
const details = byId("resume-details");
const restoreButton = byId("restore-fuel-button");
const restoreResult = byId("restore-result");

const parkedNear = (lastState) => {
  const airport = lastState.nearest_airport;

  if (!airport) {
    return formatPosition(lastState.lat, lastState.lon);
  }

  return `${airport.ident} – ${airport.name} (${formatNm(airport.distance_nm)})`;
};

const groundState = (lastState) => {
  if (lastState.on_ground) {
    return TEXT.onGround;
  }

  return TEXT.airborne;
};

const tankEntries = (levels) =>
  Object.entries(levels).map(([simvar, level]) => [`· ${tankName(simvar)}`, formatPercent(level)]);

const renderSavedState = ({ last_state: lastState, progress }) => {
  const list = element("dl", "stats");

  renderDefinitionList(list, [
    [LABELS.parkedNear, parkedNear(lastState)],
    [LABELS.lastSeen, formatDateTime(lastState.timestamp)],
    [LABELS.state, groundState(lastState)],
    [LABELS.progress, `${progress.completion_percent}% · ${formatNm(progress.flown_distance_nm)} / ${formatNm(progress.planned_distance_nm)}`],
    [LABELS.airportsVisited, `${progress.airports_visited.length} / ${progress.airports_total}`],
    [LABELS.flightTime, formatDuration(progress.airborne_seconds)],
    [LABELS.fuel, `${Math.round(lastState.fuel_percentage)}%`],
    ...tankEntries(lastState.fuel_tank_levels),
  ]);
  details.replaceChildren(list);
  hint.textContent = "";
  restoreButton.disabled = Object.keys(lastState.fuel_tank_levels).length === 0;
};

const clear = (message) => {
  details.replaceChildren();
  hint.textContent = message;
  restoreButton.disabled = true;
  restoreResult.textContent = "";
};

const loadResume = async (planId) => {
  if (planId === FREE_FLIGHT_VALUE) {
    clear(TEXT.freeFlightResume);
    return;
  }

  try {
    const resume = await request(ENDPOINTS.resume(planId));

    if (!resume.last_state) {
      clear(TEXT.noSavedState);
      return;
    }

    restoreResult.textContent = "";
    renderSavedState(resume);
  } catch (error) {
    clear(error.message);
  }
};

const restoreFuel = async () => {
  restoreResult.textContent = TEXT.restoring;

  try {
    const result = await request(ENDPOINTS.restoreFuel(getSelectedPlanId()), { method: "POST" });
    restoreResult.textContent = `${TEXT.restored} ${Object.keys(result.applied).length} ${TEXT.tanks}`;
  } catch (error) {
    restoreResult.textContent = error.message;
  }
};

export const bindResume = () => {
  restoreButton.addEventListener("click", restoreFuel);
  onPlanSelected(loadResume);
  loadResume(getSelectedPlanId());
};
