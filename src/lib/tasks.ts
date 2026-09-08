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
  /** Hex color for the event, e.g. "#2383e2". */
  color: string;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_EVENT_COLOR = "#2383e2";

/** Preset colors offered when changing an event's color. */
export const EVENT_COLORS: { value: string; label: string }[] = [
  { value: "#2383e2", label: "Blue" },
  { value: "#9b59d0", label: "Purple" },
  { value: "#2f9e6b", label: "Green" },
  { value: "#e0803a", label: "Orange" },
  { value: "#e2483d", label: "Red" },
  { value: "#d9a520", label: "Yellow" },
  { value: "#d6489b", label: "Pink" },
  { value: "#64748b", label: "Gray" },
];

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
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
