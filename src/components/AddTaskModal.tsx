"use client";

import { useEffect, useState } from "react";
import {
  CUSTOM_UNITS,
  REPEAT_LABELS,
  REPEATS,
  WEEKDAY_SHORT,
  type CustomUnit,
  type Kind,
  type Repeat,
} from "@/lib/tasks";
import { addMonthsKey, formatLongDate, weekdayOf } from "@/lib/date";
import { from12, hourTimeString, HOURS_12, type AmPm } from "@/lib/time";

export interface NewTaskPayload {
  title: string;
  date: string;
  allDay: boolean;
  time: string;
  kind: Kind;
  repeat: Repeat;
  occurrences: number;
  custom?: {
    interval: number;
    unit: CustomUnit;
    weekdays: number[];
    endType: "count" | "until";
    count: number;
    until: string;
  };
}

interface AddTaskModalProps {
  dateKey: string;
  onClose: () => void;
  onCreate: (payload: NewTaskPayload) => Promise<void>;
}

const UNIT_LABELS: Record<CustomUnit, string> = {
  day: "day",
  week: "week",
  month: "month",
};

export default function AddTaskModal({ dateKey, onClose, onCreate }: AddTaskModalProps) {
  const [kind, setKind] = useState<Kind>("task");
  const [title, setTitle] = useState("");
  const [repeat, setRepeat] = useState<Repeat>("none");
  const [occurrences, setOccurrences] = useState(10);
  const [saving, setSaving] = useState(false);

  // Event time (hour + AM/PM only)
  const [eventHour, setEventHour] = useState(9);
  const [eventAmPm, setEventAmPm] = useState<AmPm>("AM");

  // Custom recurrence state
  const [interval, setIntervalValue] = useState(1);
  const [unit, setUnit] = useState<CustomUnit>("week");
  const [weekdays, setWeekdays] = useState<number[]>([weekdayOf(dateKey)]);
  const [endType, setEndType] = useState<"count" | "until">("count");
  const [customCount, setCustomCount] = useState(10);
  const [until, setUntil] = useState(addMonthsKey(dateKey, 1));

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function toggleWeekday(day: number) {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      const isEvent = kind === "event";
      await onCreate({
        title: title.trim(),
        date: dateKey,
        allDay: !isEvent,
        time: isEvent ? hourTimeString(from12(eventHour, eventAmPm)) : "",
        kind,
        repeat,
        occurrences,
        custom:
          repeat === "custom"
            ? {
                interval,
                unit,
                weekdays: unit === "week" ? weekdays : [],
                endType,
                count: customCount,
                until,
              }
            : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  const accent = "#2383e2";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 pt-20"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-line"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="border-b border-line px-5 pb-4 pt-5">
            <input
              autoFocus
              aria-label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add title"
              className="w-full border-b-2 border-transparent bg-transparent pb-1 text-xl font-medium text-ink outline-none placeholder:text-subtle/60 focus:border-[#2383e2]"
            />
            <p className="mt-2 text-sm text-subtle">{formatLongDate(dateKey)}</p>
          </div>

          <div className="space-y-4 px-5 py-4">
            <div className="inline-flex rounded-lg bg-hover p-0.5 text-sm">
              {(["task", "event"] as Kind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={`rounded-md px-4 py-1.5 font-medium capitalize transition ${
                    kind === k ? "bg-white text-ink shadow-sm" : "text-subtle"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>

            {kind === "task" ? (
              <p className="-mt-2 flex items-center gap-2 text-xs text-subtle">
                Tasks start unscheduled — use{" "}
                <span className="rounded bg-hover px-1.5 py-0.5 font-medium text-ink">
                  Assign to time
                </span>{" "}
                on the timeline to place them.
              </p>
            ) : (
              <p className="-mt-2 text-xs text-subtle">
                Events need a time and show on the timeline (no checkbox).
              </p>
            )}

            {kind === "event" && (
              <div className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-sm text-subtle">Time</span>
                <select
                  aria-label="Hour"
                  value={eventHour}
                  onChange={(e) => setEventHour(Number(e.target.value))}
                  className="rounded-md border border-line bg-white px-2 py-1.5 text-sm text-ink outline-none focus:border-[#2383e2]"
                >
                  {HOURS_12.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="AM or PM"
                  value={eventAmPm}
                  onChange={(e) => setEventAmPm(e.target.value as AmPm)}
                  className="rounded-md border border-line bg-white px-2 py-1.5 text-sm text-ink outline-none focus:border-[#2383e2]"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            )}

            <div className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-sm text-subtle">Repeat</span>
              <select
                aria-label="Repeat"
                value={repeat}
                onChange={(e) => setRepeat(e.target.value as Repeat)}
                className="flex-1 rounded-md border border-line bg-white px-2 py-1.5 text-sm text-ink outline-none focus:border-[#2383e2]"
              >
                {REPEATS.map((r) => (
                  <option key={r} value={r}>
                    {REPEAT_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>

            {(repeat === "daily" || repeat === "weekly" || repeat === "monthly") && (
              <div className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-sm text-subtle">Ends after</span>
                <input
                  type="number"
                  min={1}
                  max={60}
                  aria-label="Number of occurrences"
                  value={occurrences}
                  onChange={(e) => setOccurrences(Number(e.target.value))}
                  className="w-20 rounded-md border border-line px-2 py-1.5 text-sm text-ink outline-none focus:border-[#2383e2]"
                />
                <span className="text-sm text-subtle">occurrences</span>
              </div>
            )}

            {repeat === "custom" && (
              <div className="space-y-3 rounded-lg border border-line bg-hover/40 p-3">
                <div className="flex items-center gap-2 text-sm text-ink">
                  <span className="text-subtle">Repeat every</span>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    aria-label="Interval"
                    value={interval}
                    onChange={(e) => setIntervalValue(Number(e.target.value))}
                    className="w-16 rounded-md border border-line px-2 py-1 outline-none focus:border-[#2383e2]"
                  />
                  <select
                    aria-label="Unit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as CustomUnit)}
                    className="rounded-md border border-line bg-white px-2 py-1 outline-none focus:border-[#2383e2]"
                  >
                    {CUSTOM_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {UNIT_LABELS[u]}
                        {interval > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {unit === "week" && (
                  <div>
                    <p className="mb-1 text-xs text-subtle">Repeat on</p>
                    <div className="flex gap-1">
                      {WEEKDAY_SHORT.map((label, day) => {
                        const active = weekdays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            aria-label={`Weekday ${day}`}
                            aria-pressed={active}
                            onClick={() => toggleWeekday(day)}
                            className={`grid h-8 w-8 place-items-center rounded-full text-xs font-medium transition ${
                              active
                                ? "bg-[#2383e2] text-white"
                                : "bg-white text-subtle ring-1 ring-line hover:ring-[#2383e2]"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-ink">
                  <span className="text-subtle">Ends</span>
                  <select
                    aria-label="End type"
                    value={endType}
                    onChange={(e) => setEndType(e.target.value as "count" | "until")}
                    className="rounded-md border border-line bg-white px-2 py-1 outline-none focus:border-[#2383e2]"
                  >
                    <option value="count">After</option>
                    <option value="until">On date</option>
                  </select>
                  {endType === "count" ? (
                    <>
                      <input
                        type="number"
                        min={1}
                        max={60}
                        aria-label="Custom occurrences"
                        value={customCount}
                        onChange={(e) => setCustomCount(Number(e.target.value))}
                        className="w-16 rounded-md border border-line px-2 py-1 outline-none focus:border-[#2383e2]"
                      />
                      <span className="text-subtle">occurrences</span>
                    </>
                  ) : (
                    <input
                      type="date"
                      aria-label="Until date"
                      value={until}
                      min={dateKey}
                      onChange={(e) => setUntil(e.target.value)}
                      className="rounded-md border border-line px-2 py-1 outline-none focus:border-[#2383e2]"
                    />
                  )}
                </div>
                <p className="text-xs text-subtle">Up to 60 occurrences are created.</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-line px-5 py-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-subtle transition hover:bg-hover"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || saving}
              style={{ backgroundColor: accent }}
              className="rounded-md px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
