import { EXTRA_TEXT, RECENT_STOPS_LIMIT } from "../../consts/extraWidgets";
import { element } from "../../sidebar/dom";
import type { VisitedAirport } from "../../types";
import { createWidgetFeed, type WidgetContext } from "../dataFeed";
import type { WidgetParams } from "../params";
import { loadAirportNames } from "./shared";

const DATE_FORMAT: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };

const recentStops = (context: WidgetContext) => {
  if (!context.progress) {
    return [];
  }

  return context.progress.airports_visited.slice(-RECENT_STOPS_LIMIT).reverse();
};

const nameOf = (ident: string, names: Map<string, string>) => {
  const name = names.get(ident);

  if (!name) {
    return "";
  }

  return name;
};

const stopRow = (stop: VisitedAirport, names: Map<string, string>) => {
  const row = element("li", "stop-row");
  row.append(
    element("strong", "stop-row__ident", stop.identifier),
    element("span", "stop-row__name", nameOf(stop.identifier, names)),
    element("span", "stop-row__date", new Date(stop.visited_at).toLocaleDateString([], DATE_FORMAT)),
  );
  return row;
};

export const startLogWidget = (root: HTMLElement, params: WidgetParams) => {
  const label = element("div", "widget__label", EXTRA_TEXT.recentStops);
  const list = element("ul", "stop-rows");
  label.hidden = !params.showLabel;
  root.append(label, list);

  const feed = createWidgetFeed(params.plan);

  feed.subscribe(async (context) => {
    const stops = recentStops(context);

    if (stops.length === 0) {
      list.replaceChildren(element("li", "widget__detail", EXTRA_TEXT.noStops));
      return;
    }

    const names = await loadAirportNames(stops.map((stop) => stop.identifier));
    list.replaceChildren(...stops.map((stop) => stopRow(stop, names)));
  });
  feed.start();
};
