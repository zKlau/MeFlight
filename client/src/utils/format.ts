import { UI_TEXT } from "../consts/messages";
import { MINUTES_PER_HOUR, ONE_MINUTE_MS } from "../consts/time";
import { DISTANCE_DECIMALS, THOUSANDS_SEPARATOR } from "../consts/track";
import type { TrackStats } from "../types";

export const parseAltitude = (altitude: string) => {
  const parsed = Number(altitude.replaceAll(THOUSANDS_SEPARATOR, ""));

  if (Number.isNaN(parsed)) {
    return 0;
  }

  return parsed;
};

export const formatDuration = (durationMs: number) => {
  const totalMinutes = Math.floor(durationMs / ONE_MINUTE_MS);
  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
  const minutes = totalMinutes % MINUTES_PER_HOUR;
  const minutesText = `${minutes}${UI_TEXT.minutesUnit}`;

  if (hours === 0) {
    return minutesText;
  }

  return `${hours}${UI_TEXT.hoursUnit} ${minutesText}`;
};

export const formatTrackStats = (stats: TrackStats) => {
  if (stats.points === 0) {
    return UI_TEXT.noTrack;
  }

  const distance = `${stats.distanceNm.toFixed(DISTANCE_DECIMALS)} ${UI_TEXT.distanceUnit}`;
  return `${distance}${UI_TEXT.statsSeparator}${formatDuration(stats.durationMs)}`;
};
