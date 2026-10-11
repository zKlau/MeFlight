import { postJson, request } from "./api.js";
import { ENDPOINTS, TEXT } from "./consts.js";
import { byId } from "./dom.js";
import { loadPlans } from "./plans.js";

const dialog = byId("settings-dialog");
const form = byId("settings-form");
const intro = byId("settings-intro");
const urlInput = byId("settings-url");
const keyInput = byId("settings-key");
const result = byId("settings-result");
const versionText = byId("settings-version");
const openButton = byId("settings-button");
const testButton = byId("settings-test");
const cancelButton = byId("settings-cancel");

const RESULT_OK = "ok";
const RESULT_ERROR = "error";

const formValues = () => ({ server_url: urlInput.value, api_key: keyInput.value });

const showResult = (message, modifier) => {
  result.textContent = message;
  result.className = "settings__result";

  if (modifier) {
    result.classList.add(modifier);
  }
};

const resultModifier = (ok) => {
  if (ok) {
    return RESULT_OK;
  }

  return RESULT_ERROR;
};

const introText = (configured) => {
  if (configured) {
    return TEXT.settingsEdit;
  }

  return TEXT.settingsWelcome;
};

const openDialog = async () => {
  const settings = await request(ENDPOINTS.settings);
  urlInput.value = settings.server_url;
  keyInput.value = settings.api_key;
  intro.textContent = introText(settings.configured);
  versionText.textContent = `${TEXT.version} ${settings.version}`;
  cancelButton.hidden = !settings.configured;
  showResult("");
  dialog.showModal();
  return settings;
};

const testConnection = async () => {
  showResult(TEXT.testing);
  const check = await postJson(ENDPOINTS.testSettings, formValues());
  showResult(check.message, resultModifier(check.ok));
  return check;
};

const save = async (event) => {
  event.preventDefault();
  const check = await testConnection();

  if (!check.ok) {
    return;
  }

  showResult(TEXT.saving);
  await request(ENDPOINTS.settings, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formValues()),
  });
  dialog.close();
  loadPlans();
};

const preventDismissWhileUnconfigured = (event) => {
  if (cancelButton.hidden) {
    event.preventDefault();
  }
};

export const bindSettings = async () => {
  openButton.addEventListener("click", openDialog);
  testButton.addEventListener("click", testConnection);
  cancelButton.addEventListener("click", () => dialog.close());
  dialog.addEventListener("cancel", preventDismissWhileUnconfigured);
  form.addEventListener("submit", save);

  const settings = await request(ENDPOINTS.settings);

  if (!settings.configured) {
    openDialog();
  }
};
