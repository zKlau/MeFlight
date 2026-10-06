import "leaflet/dist/leaflet.css";
import "../styles/widget.css";
import { WIDGET_TEXT, WIDGET_TYPES, type ValueWidgetType } from "../consts/widgets";
import { createWidgetFeed, type WidgetContext } from "./dataFeed";
import { startCountriesWidget } from "./countriesWidget";
import { startMapWidget } from "./mapWidget";
import { readWidgetParams, type WidgetParams } from "./params";
import { createWidgetRenderer, prepareRoot } from "./render";
import { STRIP_ITEMS, VALUE_WIDGETS, type WidgetView } from "./valueWidgets";

const MAP_MODIFIER = "widget--map";
const STRIP_MODIFIER = "widget--strip";
const SINGLE_MODIFIER = "widget--single";
const COUNTRIES_MODIFIER = "widget--countries";

const root = document.getElementById("widget") as HTMLElement;

const viewsFor = (types: ValueWidgetType[]) => (context: WidgetContext): WidgetView[] =>
  types.map((type) => VALUE_WIDGETS[type](context));

const startValueWidget = (params: WidgetParams, types: ValueWidgetType[], modifier: string) => {
  prepareRoot(root, params, modifier);
  const render = createWidgetRenderer(root, params, viewsFor(types), types.length);
  const feed = createWidgetFeed(params.plan);
  feed.subscribe(render);
  feed.start();
};

const start = (params: WidgetParams) => {
  if (params.type === null) {
    root.textContent = WIDGET_TEXT.unknownWidget;
    return;
  }

  if (params.type === WIDGET_TYPES.map) {
    prepareRoot(root, params, MAP_MODIFIER);
    startMapWidget(root, params);
    return;
  }

  if (params.type === WIDGET_TYPES.countries || params.type === WIDGET_TYPES.countriesAll) {
    prepareRoot(root, params, COUNTRIES_MODIFIER);
    startCountriesWidget(root, params, params.type === WIDGET_TYPES.countriesAll);
    return;
  }

  if (params.type === WIDGET_TYPES.strip) {
    startValueWidget(params, STRIP_ITEMS, STRIP_MODIFIER);
    return;
  }

  startValueWidget(params, [params.type], SINGLE_MODIFIER);
};

start(readWidgetParams(location.search));
