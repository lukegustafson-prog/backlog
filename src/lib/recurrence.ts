import { addDaysKey, addMonthsKey, diffDays, weekdayOf } from "./date";
import type { CustomUnit } from "./tasks";

export const MAX_OCCURRENCES = 60;

export interface OccurrenceSpec {
  unit: CustomUnit;
  interval: number;
  /** UTC weekday numbers; only used when unit is "week". Empty = the start day's weekday. */
  weekdays: number[];
  endType: "count" | "until";
  count: number;
  /** YYYY-MM-DD when endType is "until". */
  until: string;
}

/**
 * Expand a recurrence into concrete `YYYY-MM-DD` day keys, always starting at
 * `startKey`. The result is capped at {@link MAX_OCCURRENCES}.
 */
export function generateOccurrences(startKey: string, spec: OccurrenceSpec): string[] {
  const interval = Math.max(1, Math.trunc(spec.interval) || 1);
  const cap =
    spec.endType === "count"
      ? Math.min(Math.max(1, Math.trunc(spec.count) || 1), MAX_OCCURRENCES)
      : MAX_OCCURRENCES;
  const until = spec.endType === "until" ? spec.until : null;

  if (spec.unit === "week") {
    const weekdays =
      spec.weekdays.length > 0
        ? Array.from(new Set(spec.weekdays)).sort((a, b) => a - b)
        : [weekdayOf(startKey)];

    const anchorSunday = addDaysKey(startKey, -weekdayOf(startKey));
    const keys: string[] = [];
    let cursor = startKey;
    const guardMax = MAX_OCCURRENCES * 7 * interval + 366;

    for (let guard = 0; guard < guardMax && keys.length < cap; guard++) {
      if (until && cursor > until) break;
      const cursorSunday = addDaysKey(cursor, -weekdayOf(cursor));
      const weekIndex = diffDays(cursorSunday, anchorSunday) / 7;
      if (weekIndex % interval === 0 && weekdays.includes(weekdayOf(cursor))) {
        keys.push(cursor);
      }
      cursor = addDaysKey(cursor, 1);
    }
    return keys;
  }

  const keys: string[] = [];
  for (let i = 0; keys.length < cap && i < MAX_OCCURRENCES * 4; i++) {
    const key =
      spec.unit === "day"
        ? addDaysKey(startKey, i * interval)
        : addMonthsKey(startKey, i * interval);
    if (until && key > until) break;
    keys.push(key);
  }
  return keys;
}
