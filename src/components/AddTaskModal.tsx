"use client";

import { useEffect, useState } from "react";
import { REPEAT_LABELS, REPEATS, type Repeat } from "@/lib/tasks";
import { formatLongDate } from "@/lib/date";

export interface NewTaskPayload {
  title: string;
  description: string;
  date: string;
  allDay: boolean;
  time: string;
  repeat: Repeat;
  occurrences: number;
}

interface AddTaskModalProps {
  dateKey: string;
  onClose: () => void;
  onCreate: (payload: NewTaskPayload) => Promise<void>;
}

export default function AddTaskModal({ dateKey, onClose, onCreate }: AddTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [allDay, setAllDay] = useState(true);
  const [time, setTime] = useState("09:00");
  const [repeat, setRepeat] = useState<Repeat>("none");
  const [occurrences, setOccurrences] = useState(10);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      await onCreate({
        title: title.trim(),
        description: description.trim(),
        date: dateKey,
        allDay,
        time: allDay ? "" : time,
        repeat,
        occurrences,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 pt-24"
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
              aria-label="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add title"
              className="w-full border-b-2 border-transparent bg-transparent pb-1 text-xl font-medium text-ink outline-none placeholder:text-subtle/60 focus:border-[#2383e2]"
            />
            <p className="mt-2 text-sm text-subtle">{formatLongDate(dateKey)}</p>
          </div>

          <div className="space-y-4 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-sm text-subtle">When</span>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={(e) => setAllDay(e.target.checked)}
                  className="h-4 w-4 accent-[#2383e2]"
                />
                All day
              </label>
              {!allDay && (
                <input
                  type="time"
                  aria-label="Task time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="rounded-md border border-line px-2 py-1 text-sm text-ink outline-none focus:border-[#2383e2]"
                />
              )}
            </div>

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

            {repeat !== "none" && (
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

            <div className="flex items-start gap-3">
              <span className="w-24 shrink-0 pt-1 text-sm text-subtle">Notes</span>
              <textarea
                aria-label="Task description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description"
                rows={2}
                className="flex-1 resize-none rounded-md border border-line px-3 py-2 text-sm text-ink outline-none focus:border-[#2383e2]"
              />
            </div>
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
              className="rounded-md bg-[#2383e2] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#1a6fc4] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
