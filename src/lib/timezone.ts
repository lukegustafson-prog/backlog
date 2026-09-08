import { TIMEZONE_KEY, readString } from "./settings";

/** US time zones offered in settings. `id` is a valid IANA zone. */
export const US_TIMEZONES = [
  { id: "America/New_York", label: "Eastern (ET)" },
  { id: "America/Chicago", label: "Central (CT)" },
  { id: "America/Denver", label: "Mountain (MT)" },
  { id: "America/Phoenix", label: "Arizona (no DST)" },
  { id: "America/Los_Angeles", label: "Pacific (PT)" },
  { id: "America/Anchorage", label: "Alaska (AKT)" },
  { id: "Pacific/Honolulu", label: "Hawaii (HT)" },
] as const;

export type USTimezoneId = (typeof US_TIMEZONES)[number]["id"];

const VALID_IDS = new Set(US_TIMEZONES.map((t) => t.id));

/** The device's own IANA zone, or Eastern if it can't be determined. */
export function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
  } catch {
    return "America/New_York";
  }
}

/**
 * The effective zone for date/time math: the explicitly-saved US zone when set,
 * otherwise the device zone (so behaviour is unchanged until the user picks one).
 */
export function effectiveTimezone(): string {
  const saved = readString(TIMEZONE_KEY, "");
  if (saved && VALID_IDS.has(saved as USTimezoneId)) return saved;
  return deviceTimezone();
}

/** The saved US zone id, or "" when the user hasn't chosen one. */
export function savedTimezone(): string {
  const saved = readString(TIMEZONE_KEY, "");
  return VALID_IDS.has(saved as USTimezoneId) ? saved : "";
}

/** Current `YYYY-MM-DD` and `HH:MM` (24h) in the given zone. */
export function partsInZone(tz: string, date: Date = new Date()): { dateKey: string; time: string } {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(date);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    let hour = get("hour");
    if (hour === "24") hour = "00"; // some engines report 24 at midnight
    const dateKey = `${get("year")}-${get("month")}-${get("day")}`;
    return { dateKey, time: `${hour}:${get("minute")}` };
  } catch {
    const d = date;
    const dateKey = d.toISOString().slice(0, 10);
    const time = `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
    return { dateKey, time };
  }
}
