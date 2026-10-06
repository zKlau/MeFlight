import { FLAG_URL } from "../consts/countries";
import { element } from "../sidebar/dom";
type FlagCountry = { code: string; name: string };

export const flagImage = (country: FlagCountry, className: string) => {
  const image = element("img", className);
  image.src = FLAG_URL(country.code);
  image.alt = country.code;
  image.title = country.name;
  image.loading = "lazy";
  return image;
};
