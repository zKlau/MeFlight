import { element } from "../dom.js";

const SELECTED_CLASS = "selected";

const listItem = (waypoint, index, model) => {
  const item = element("li", "editor-list__item");
  item.append(
    element("span", "editor-list__index", String(index + 1)),
    element("strong", "", waypoint.identifier),
    element("span", "editor-list__type", waypoint.waypoint_type),
  );
  item.addEventListener("click", () => model.select(index));

  if (index === model.state.selected) {
    item.classList.add(SELECTED_CLASS);
  }

  return item;
};

const keepVisible = (list, item) => {
  const top = item.offsetTop;
  const bottom = top + item.offsetHeight;

  if (top < list.scrollTop) {
    list.scrollTop = top;
    return;
  }

  if (bottom > list.scrollTop + list.clientHeight) {
    list.scrollTop = bottom - list.clientHeight;
  }
};

export const createEditorList = (list, model) => {
  model.subscribe((state) => {
    list.replaceChildren(...state.waypoints.map((waypoint, index) => listItem(waypoint, index, model)));
    const selected = list.querySelector(`.${SELECTED_CLASS}`);

    if (selected) {
      requestAnimationFrame(() => keepVisible(list, selected));
    }
  });
};
