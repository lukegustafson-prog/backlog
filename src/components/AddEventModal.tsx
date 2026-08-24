"use client";

import { useEffect, useState } from "react";
import {
  CUSTOM_UNITS,
  REPEAT_LABELS,
  REPEATS,
  WEEKDAY_SHORT,
  type CustomUnit,
  type Repeat,
} from "@/lib/tasks";
import { addMonthsKey, formatLongDate, weekdayOf } from "@/lib/date";
import TimePicker from "./TimePicker";

export interface NewEventPayload {
  title: string;
  date: string;
  description: string;
  time: string;
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

export interface EventPrefill {
  title?: string;
  time?: string;
  notes?: string;
}

interface AddEventModalProps {
  dateKey: string;
  prefill?: EventPrefill;
  onClose: () => void;
  onCreate: (payload: NewEventPayload) => Promise<void>;
}

const UNIT_LABELS: Record<CustomUnit, string> = { day: "day", week: "week", month: "month" };

export default function AddEventModal({ dateKey, prefill, onClose, onCreate }: AddEventModalProps) {
  const [title, setTitle] = useState(prefill?.title ?? "");
  const [notes, setNotes] = useState(prefill?.notes ?? "");
  const [time, setTime] = useState(prefill?.time ?? "09:00");
  const [repeat, setRepeat] = useState<Repeat>("none");
  const [occurrences, setOccurrences] = useState(10);
  const [saving, setSaving] = useState(false);

  // Custom recurrence
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
      await onCreate({
        title: title.trim(),
        date: dateKey,
        description: notes.trim(),
        time,
        repeat,
        occurrences,
        custom:
          repeat === "custom"
            ? { interval, unit, weekdays: unit === "week" ? weekdays : [], endType, count: customCount, until }
            : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 pt-20"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl bg-surface shadow-2xl ring-1 ring-line"
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
            <div className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-sm text-subtle">Time</span>
              <TimePicker value={time} onChange={setTime} />
            </div>

            <div className="flex items-start gap-3">
              <span className="w-24 shrink-0 pt-2 text-sm text-subtle">Notes</span>
              <textarea
                aria-label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes (optional)"
                rows={2}
                className="flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-[#2383e2]"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-sm text-subtle">Repeat</span>
              <select
                aria-label="Repeat"
                value={repeat}
                onChange={(e) => setRepeat(e.target.value as Repeat)}
                className="flex-1 rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-ink outline-none focus:border-[#2383e2]"
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
                    className="rounded-md border border-line bg-surface px-2 py-1 outline-none focus:border-[#2383e2]"
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
                                : "bg-surface text-subtle ring-1 ring-line hover:ring-[#2383e2]"
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
                    className="rounded-md border border-line bg-surface px-2 py-1 outline-none focus:border-[#2383e2]"
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
              className="rounded-md bg-[#2383e2] px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
