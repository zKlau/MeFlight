import { STATUS_POLL_MS } from "./consts.js";
import { bindPlans, loadPlans } from "./plans.js";
import { bindResume } from "./resume.js";
import { bindRecordingButtons, refreshStatus } from "./status.js";

bindPlans();
bindResume();
bindRecordingButtons();
loadPlans();
refreshStatus();
setInterval(refreshStatus, STATUS_POLL_MS);
