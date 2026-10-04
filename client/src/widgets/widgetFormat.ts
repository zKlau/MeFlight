import { ONE_SECOND_MS } from "../consts/time";
import { WIDGET_TEXT } from "../consts/widgets";
import { formatDuration } from "../utils/format";

const ETA_TIME_FORMAT: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };
const ETA_DATE_FORMAT: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short", ...ETA_TIME_FORMAT };
const SECONDS_PER_DAY = 86_400;

export const formatWhole = (value: number) => Math.round(value).toLocaleString();

export const formatSigned = (value: number) => {
  const rounded = Math.round(value);

  if (rounded > 0) {
    return `+${rounded.toLocaleString()}`;
  }

  return rounded.toLocaleString();
};

export const formatDurationSeconds = (seconds: number | null) => {
  if (seconds === null) {
    return WIDGET_TEXT.empty;
  }

  return formatDuration(seconds * ONE_SECOND_MS);
};

export const formatEta = (seconds: number | null) => {
  if (seconds === null) {
    return WIDGET_TEXT.empty;
  }

  const arrival = new Date(Date.now() + seconds * ONE_SECOND_MS);

  if (seconds < SECONDS_PER_DAY) {
    return arrival.toLocaleTimeString([], ETA_TIME_FORMAT);
  }

  return arrival.toLocaleString([], ETA_DATE_FORMAT);
};
