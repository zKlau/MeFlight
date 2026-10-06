import { element } from "../../sidebar/dom";
import type { AircraftTelemetry } from "../../types";

const ACTIVE_CLASS = "chip--active";
const NO_VALUE = "";

export type ChipDefinition = {
  label: string;
  isActive: (live: AircraftTelemetry) => boolean;
  value?: (live: AircraftTelemetry) => string;
};

type Chip = {
  definition: ChipDefinition;
  node: HTMLElement;
  value: HTMLElement;
};

const createChip = (definition: ChipDefinition): Chip => {
  const node = element("div", "chip");
  const value = element("span", "chip__value");
  node.append(element("span", "chip__label", definition.label), value);
  return { definition, node, value };
};

const valueOf = (definition: ChipDefinition, live: AircraftTelemetry) => {
  if (!definition.value) {
    return NO_VALUE;
  }

  return definition.value(live);
};

export const createChipRow = (root: HTMLElement, definitions: ChipDefinition[]) => {
  const row = element("div", "chip-row");
  const chips = definitions.map(createChip);
  row.append(...chips.map((chip) => chip.node));
  root.append(row);

  return (live: AircraftTelemetry) => {
    chips.forEach((chip) => {
      chip.node.classList.toggle(ACTIVE_CLASS, chip.definition.isActive(live));
      chip.value.textContent = valueOf(chip.definition, live);
    });
  };
};
