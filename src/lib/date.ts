/**
 * Day handling utilities. A "day key" is a `YYYY-MM-DD` string and every task's
 * `date` is stored at UTC midnight of its day so comparisons are timezone-safe.
 */

export function toDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function dayKeyToDate(key: string): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

export function todayKey(): string {
  return toDayKey(new Date());
}

export function isValidDayKey(key: unknown): key is string {
  return typeof key === "string" && /^\d{4}-\d{2}-\d{2}$/.test(key) && !Number.isNaN(Date.parse(`${key}T00:00:00.000Z`));
}

export function addDaysKey(key: string, amount: number): string {
  const d = dayKeyToDate(key);
  d.setUTCDate(d.getUTCDate() + amount);
  return toDayKey(d);
}

export function addMonthsKey(key: string, amount: number): string {
  const d = dayKeyToDate(key);
  const targetMonth = d.getUTCMonth() + amount;
  const result = new Date(Date.UTC(d.getUTCFullYear(), targetMonth, 1));
  // Clamp the day so e.g. Jan 31 + 1 month lands on the last day of February.
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(d.getUTCDate(), lastDay));
  return toDayKey(result);
}

export function formatLongDate(key: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(dayKeyToDate(key));
}

export function formatShortDate(key: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(dayKeyToDate(key));
}

export function relativeDayLabel(key: string): string | null {
  const today = todayKey();
  if (key === today) return "Today";
  if (key === addDaysKey(today, 1)) return "Tomorrow";
  if (key === addDaysKey(today, -1)) return "Yesterday";
  return null;
}
