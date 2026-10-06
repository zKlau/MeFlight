import { COUNTRIES_TEXT, COUNTRY_SCOPES, type CountryScope } from "../consts/countries";
import type { CountriesResponse, CountryVisit } from "../types";
import { flagImage } from "../utils/flags";
import { formatDateTime } from "../utils/format";
import { element } from "./dom";

const ACTIVE_CLASS = "active";

const SCOPE_LABELS: Record<CountryScope, string> = {
  [COUNTRY_SCOPES.trip]: COUNTRIES_TEXT.thisTrip,
  [COUNTRY_SCOPES.all]: COUNTRIES_TEXT.allFlights,
};

const scopeButton = (scope: CountryScope, active: CountryScope, onChange: (scope: CountryScope) => void) => {
  const button = element("button", "scope-switch__option", SCOPE_LABELS[scope]);
  button.type = "button";
  button.addEventListener("click", () => onChange(scope));

  if (scope === active) {
    button.classList.add(ACTIVE_CLASS);
  }

  return button;
};

export const scopeSwitch = (active: CountryScope, onChange: (scope: CountryScope) => void) => {
  const container = element("div", "scope-switch");
  container.append(
    scopeButton(COUNTRY_SCOPES.trip, active, onChange),
    scopeButton(COUNTRY_SCOPES.all, active, onChange),
  );
  return container;
};

const countryItem = (country: CountryVisit) => {
  const item = element("li", "country-list__item");
  item.title = `${COUNTRIES_TEXT.firstVisited}: ${formatDateTime(country.first_visited_at)}`;
  item.append(flagImage(country, "country-list__flag"), element("span", "", country.name));
  return item;
};

const countryGroup = (title: string, countries: CountryVisit[]) => {
  if (countries.length === 0) {
    return [];
  }

  const list = element("ul", "country-list");
  list.append(...countries.map(countryItem));
  return [element("h4", "country-group__title", `${title} · ${countries.length}`), list];
};

export const countryGroups = (response: CountriesResponse) => {
  if (response.total === 0) {
    return [element("p", "muted", COUNTRIES_TEXT.none)];
  }

  return [
    ...countryGroup(COUNTRIES_TEXT.landed, response.countries.filter((country) => country.landed)),
    ...countryGroup(COUNTRIES_TEXT.flownOver, response.countries.filter((country) => !country.landed)),
  ];
};

export const countriesError = () => [element("p", "muted", COUNTRIES_TEXT.loadFailed)];
