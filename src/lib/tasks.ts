export const REPEATS = ["none", "daily", "weekly", "monthly", "custom"] as const;
export type Repeat = (typeof REPEATS)[number];

export const REPEAT_LABELS: Record<Repeat, string> = {
  none: "Does not repeat",
  daily: "Every day",
  weekly: "Every week",
  monthly: "Every month",
  custom: "Custom…",
};

export function isRepeat(value: unknown): value is Repeat {
  return typeof value === "string" && (REPEATS as readonly string[]).includes(value);
}

export const KINDS = ["task", "event"] as const;
export type Kind = (typeof KINDS)[number];

export function isKind(value: unknown): value is Kind {
  return typeof value === "string" && (KINDS as readonly string[]).includes(value);
}

export const CUSTOM_UNITS = ["day", "week", "month"] as const;
export type CustomUnit = (typeof CUSTOM_UNITS)[number];

export interface CustomRecurrence {
  interval: number;
  unit: CustomUnit;
  /** UTC weekday numbers (0=Sun … 6=Sat); only meaningful when unit is "week". */
  weekdays: number[];
  endType: "count" | "until";
  count: number;
  /** YYYY-MM-DD when endType is "until". */
  until: string;
}

export interface Task {
  id: string;
  seriesId: string | null;
  kind: Kind;
  title: string;
  description: string;
  /** ISO timestamp at UTC midnight of the scheduled day. */
  date: string;
  allDay: boolean;
  /** "HH:MM" when not an all-day item. */
  time: string;
  completed: boolean;
  repeat: Repeat;
  createdAt: string;
  updatedAt: string;
}

export const WEEKDAY_SHORT = ["S", "M", "T", "W", "T", "F", "S"];
export const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
