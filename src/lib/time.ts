/** Helpers for working with "HH:MM" 24-hour time strings and 12-hour display. */

export type AmPm = "AM" | "PM";

export function isValidTime(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function parseHour(time: string): number | null {
  if (!isValidTime(time)) return null;
  return Number(time.slice(0, 2));
}

export function to12(hour24: number): { hour: number; ampm: AmPm } {
  const ampm: AmPm = hour24 >= 12 ? "PM" : "AM";
  let hour = hour24 % 12;
  if (hour === 0) hour = 12;
  return { hour, ampm };
}

export function from12(hour: number, ampm: AmPm): number {
  const base = hour % 12;
  return ampm === "PM" ? base + 12 : base;
}

export function formatHour(hour24: number): string {
  const { hour, ampm } = to12(hour24);
  return `${hour} ${ampm}`;
}

/** A "HH:00" string for a whole-hour time. */
export function hourTimeString(hour24: number): string {
  return `${String(hour24).padStart(2, "0")}:00`;
}

/** A "HH:MM" string from a 24-hour hour and a minute. */
export function timeString(hour24: number, minute: number): string {
  return `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function parseMinute(time: string): number | null {
  if (!isValidTime(time)) return null;
  return Number(time.slice(3, 5));
}

/** Format a "HH:MM" time as "9:05 AM". */
export function formatTime(time: string): string {
  const hour = parseHour(time);
  const minute = parseMinute(time);
  if (hour === null || minute === null) return "";
  const { hour: h12, ampm } = to12(hour);
  return `${h12}:${String(minute).padStart(2, "0")} ${ampm}`;
}

export const HOURS_12 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export const MINUTES = Array.from({ length: 60 }, (_, i) => i);
