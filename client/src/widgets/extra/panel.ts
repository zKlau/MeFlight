import { element } from "../../sidebar/dom";

const PERCENT = 100;
const TONE_PREFIX = "widget--tone-";
const TONES = ["good", "ok", "bad"];

export type Panel = {
  label: HTMLElement;
  value: HTMLElement;
  detail: HTMLElement;
  extra: HTMLElement;
  setFraction: (fraction: number | null) => void;
  setTone: (tone: string | null) => void;
};

const clampPercent = (fraction: number) => Math.min(PERCENT, Math.max(0, fraction * PERCENT));

export const createPanel = (root: HTMLElement, labelText: string, showLabel: boolean): Panel => {
  const label = element("div", "widget__label", labelText);
  const value = element("div", "widget__value");
  const detail = element("div", "widget__detail");
  const extra = element("div", "widget__extra");
  const bar = element("div", "widget__bar");
  const fill = element("div", "widget__bar-fill");

  label.hidden = !showLabel;
  bar.hidden = true;
  bar.append(fill);
  root.append(label, value, detail, extra, bar);

  const setFraction = (fraction: number | null) => {
    bar.hidden = fraction === null;

    if (fraction !== null) {
      fill.style.width = `${clampPercent(fraction)}%`;
    }
  };

  const setTone = (tone: string | null) => {
    TONES.forEach((name) => root.classList.toggle(`${TONE_PREFIX}${name}`, name === tone));
  };

  return { label, value, detail, extra, setFraction, setTone };
};
