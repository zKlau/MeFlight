export const LATEST_FLIGHT = "latest";

const PLAN_HASH_PREFIX = "#plan=";

type SelectionListener = (selection: string) => void;

const listeners = new Set<SelectionListener>();
let current = LATEST_FLIGHT;

const writeHash = (selection: string) => {
  if (selection === LATEST_FLIGHT) {
    history.replaceState(null, "", location.pathname);
    return;
  }

  history.replaceState(null, "", `${PLAN_HASH_PREFIX}${selection}`);
};

export const selectionFromHash = () => {
  if (!location.hash.startsWith(PLAN_HASH_PREFIX)) {
    return LATEST_FLIGHT;
  }

  return location.hash.slice(PLAN_HASH_PREFIX.length);
};

export const isPlanSelection = (selection: string) => selection !== LATEST_FLIGHT;

export const getSelection = () => current;

export const select = (selection: string) => {
  current = selection;
  writeHash(selection);
  listeners.forEach((listener) => listener(selection));
};

export const onSelectionChange = (listener: SelectionListener) => {
  listeners.add(listener);
};
