export const element = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = "",
  text?: string,
) => {
  const node = document.createElement(tag);
  node.className = className;

  if (text !== undefined) {
    node.textContent = text;
  }

  return node;
};

export const definitionList = (entries: [string, string][]) => {
  const list = element("dl", "sidebar-stats");

  for (const [label, value] of entries) {
    list.append(element("dt", "", label), element("dd", "", value));
  }

  return list;
};
