export const REPEATS = ["none", "daily", "weekly", "monthly"] as const;
export type Repeat = (typeof REPEATS)[number];

export const REPEAT_LABELS: Record<Repeat, string> = {
  none: "Does not repeat",
  daily: "Every day",
  weekly: "Every week",
  monthly: "Every month",
};

export function isRepeat(value: unknown): value is Repeat {
  return typeof value === "string" && (REPEATS as readonly string[]).includes(value);
}

export interface Task {
  id: string;
  seriesId: string | null;
  title: string;
  description: string;
  /** ISO timestamp at UTC midnight of the scheduled day. */
  date: string;
  allDay: boolean;
  /** "HH:MM" when not an all-day task. */
  time: string;
  completed: boolean;
  repeat: Repeat;
  createdAt: string;
  updatedAt: string;
}
