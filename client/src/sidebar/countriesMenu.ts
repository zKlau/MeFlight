import { fetchJson } from "../apiService";
import { COUNTRY_SCOPES, type CountryScope } from "../consts/countries";
import { ENDPOINTS } from "../consts/endpoints";
import { LOG_MESSAGES } from "../consts/messages";
import { PROGRESS_REFRESH_MS } from "../consts/time";
import { getSelection, isPlanSelection, onSelectionChange } from "../selection";
import type { CountriesResponse } from "../types";
import { countriesError, countryGroups, scopeSwitch } from "./countriesView";

const defaultScope = (selection: string): CountryScope => {
  if (isPlanSelection(selection)) {
    return COUNTRY_SCOPES.trip;
  }

  return COUNTRY_SCOPES.all;
};

const endpointFor = (scope: CountryScope, selection: string) => {
  if (scope === COUNTRY_SCOPES.trip && isPlanSelection(selection)) {
    return ENDPOINTS.flightPlanCountries(selection);
  }

  return ENDPOINTS.countries;
};

export const createCountriesMenu = (menu: HTMLDetailsElement, count: HTMLElement, body: HTMLElement) => {
  let scope = defaultScope(getSelection());
  let requestId = 0;

  const switchFor = () => {
    if (!isPlanSelection(getSelection())) {
      return [];
    }

    return [scopeSwitch(scope, changeScope)];
  };

  const render = (response: CountriesResponse) => {
    count.textContent = String(response.total);
    body.replaceChildren(...switchFor(), ...countryGroups(response));
  };

  const load = async () => {
    const currentRequest = ++requestId;

    try {
      const response = await fetchJson<CountriesResponse>(endpointFor(scope, getSelection()));

      if (currentRequest === requestId) {
        render(response);
      }
    } catch (error) {
      console.warn(LOG_MESSAGES.countriesFetchFailed, error);
      body.replaceChildren(...switchFor(), ...countriesError());
    }
  };

  const changeScope = (nextScope: CountryScope) => {
    scope = nextScope;
    load();
  };

  const refreshWhileOpen = () => {
    if (menu.open) {
      load();
    }
  };

  onSelectionChange((selection) => {
    scope = defaultScope(selection);
    load();
  });
  menu.addEventListener("toggle", refreshWhileOpen);
  setInterval(refreshWhileOpen, PROGRESS_REFRESH_MS);
};
