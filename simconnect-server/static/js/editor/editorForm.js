import { request } from "../api.js";
import { element } from "../dom.js";
import {
  AIRPORT_TYPE,
  COORDINATE_DECIMALS,
  EDITOR_ENDPOINTS,
  EDITOR_TEXT,
  MIN_WAYPOINTS,
  NEW_POINT_OFFSET_DEGREES,
  WAYPOINT_TYPES,
} from "./editorConsts.js";

const NONE = -1;

const field = (labelText, input) => {
  const label = element("label", "field editor-field");
  label.append(labelText, input);
  return label;
};

const textInput = (value, type) => {
  const input = element("input", "editor-input");
  input.type = type;
  input.value = value;
  return input;
};

const formatCoordinate = (value) => value.toFixed(COORDINATE_DECIMALS);

const altitudeValue = (altitude) => {
  if (altitude === null || altitude === undefined) {
    return "";
  }

  return String(Math.round(altitude));
};

const parseAltitude = (text) => {
  if (text.trim() === "") {
    return null;
  }

  return Number(text);
};

const typeOption = (type) => {
  const option = element("option", "", type);
  option.value = type;
  return option;
};

const typeSelect = (current) => {
  const select = element("select", "editor-input");
  const types = [...new Set([...WAYPOINT_TYPES, current].filter(Boolean))];
  select.append(...types.map(typeOption));

  if (current) {
    select.value = current;
  }

  return select;
};

const button = (text, className, onClick) => {
  const node = element("button", className, text);
  node.type = "button";
  node.addEventListener("click", onClick);
  return node;
};

export const createEditorForm = (container, model, setMessage) => {
  const offsetPosition = (index) => {
    const current = model.state.waypoints[index];
    const next = model.state.waypoints[index + 1];

    if (!next) {
      return [current.latitude + NEW_POINT_OFFSET_DEGREES, current.longitude + NEW_POINT_OFFSET_DEGREES];
    }

    return [(current.latitude + next.latitude) / 2, (current.longitude + next.longitude) / 2];
  };

  const lookUpAirport = async (index, ident) => {
    try {
      const airport = await request(EDITOR_ENDPOINTS.airport(ident));
      model.update(index, { identifier: airport.ident, latitude: airport.latitude, longitude: airport.longitude, waypoint_type: AIRPORT_TYPE });
      setMessage(airport.name);
    } catch {
      setMessage(EDITOR_TEXT.airportNotFound);
    }
  };

  const removePoint = (index) => {
    if (model.state.waypoints.length <= MIN_WAYPOINTS) {
      setMessage(EDITOR_TEXT.tooFew);
      return;
    }

    model.remove(index);
  };

  const renderFields = (index) => {
    const waypoint = model.state.waypoints[index];
    const identifier = textInput(waypoint.identifier, "text");
    const type = typeSelect(waypoint.waypoint_type);
    const latitude = textInput(formatCoordinate(waypoint.latitude), "number");
    const longitude = textInput(formatCoordinate(waypoint.longitude), "number");
    const altitude = textInput(altitudeValue(waypoint.altitude), "number");

    identifier.addEventListener("change", () => model.update(index, { identifier: identifier.value.trim().toUpperCase() }));
    type.addEventListener("change", () => model.update(index, { waypoint_type: type.value }));
    latitude.addEventListener("change", () => model.update(index, { latitude: Number(latitude.value) }));
    longitude.addEventListener("change", () => model.update(index, { longitude: Number(longitude.value) }));
    altitude.addEventListener("change", () => model.update(index, { altitude: parseAltitude(altitude.value) }));

    const fields = element("div", "editor-fields");
    fields.append(
      field(EDITOR_TEXT.identifier, identifier),
      field(EDITOR_TEXT.type, type),
      field(EDITOR_TEXT.latitude, latitude),
      field(EDITOR_TEXT.longitude, longitude),
      field(EDITOR_TEXT.altitude, altitude),
    );

    const actions = element("div", "actions");
    actions.append(
      button(EDITOR_TEXT.lookUp, "", () => lookUpAirport(index, identifier.value.trim())),
      button(EDITOR_TEXT.moveUp, "", () => model.swap(index, index - 1)),
      button(EDITOR_TEXT.moveDown, "", () => model.swap(index, index + 1)),
      button(EDITOR_TEXT.addAfter, "", () => model.insert(index + 1, ...offsetPosition(index))),
      button(EDITOR_TEXT.remove, "danger", () => removePoint(index)),
    );

    container.replaceChildren(element("h3", "editor-form__title", `#${index + 1} ${waypoint.identifier}`), fields, actions);
  };

  model.subscribe((state) => {
    if (state.selected === NONE || state.selected >= state.waypoints.length) {
      container.replaceChildren(element("p", "muted", EDITOR_TEXT.noSelection));
      return;
    }

    renderFields(state.selected);
  });
};
