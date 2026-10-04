export const byId = (id) => document.getElementById(id);

export const element = (tag, className, text) => {
  const node = document.createElement(tag);

  if (className) {
    node.className = className;
  }

  if (text !== undefined) {
    node.textContent = text;
  }

  return node;
};

export const renderDefinitionList = (list, entries) => {
  list.replaceChildren();

  for (const [label, value] of entries) {
    list.append(element("dt", "", label), element("dd", "", value));
  }
};

export const setPill = (pill, text, modifier) => {
  pill.textContent = text;
  pill.className = "pill";

  if (modifier) {
    pill.classList.add(modifier);
  }
};
