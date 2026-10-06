import { FLAG_URL } from "../consts/countries";
import { element } from "../sidebar/dom";
import type { CountryVisit } from "../types";

export const flagImage = (country: CountryVisit, className: string) => {
  const image = element("img", className);
  image.src = FLAG_URL(country.code);
  image.alt = country.code;
  image.title = country.name;
  image.loading = "lazy";
  return image;
};
