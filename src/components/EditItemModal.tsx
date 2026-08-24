"use client";

import { useEffect, useState } from "react";
import type { Task } from "@/lib/tasks";
import { formatLongDate } from "@/lib/date";
import { isValidTime } from "@/lib/time";
import TimePicker from "./TimePicker";

export interface EditPayload {
  title: string;
  description: string;
  allDay: boolean;
  time: string;
}

interface EditItemModalProps {
  task: Task;
  onClose: () => void;
  onSave: (payload: EditPayload) => Promise<void>;
  onDelete?: () => void;
}

export default function EditItemModal({ task, onClose, onSave, onDelete }: EditItemModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [time, setTime] = useState(isValidTime(task.time) ? task.time : "09:00");
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
      await onSave({ title: title.trim(), description: description.trim(), allDay: false, time });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 pt-16"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl bg-surface shadow-2xl ring-1 ring-line"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="border-b border-line px-5 pb-3 pt-4">
            <input
              autoFocus
              aria-label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full border-b-2 border-transparent bg-transparent pb-1 text-lg font-medium text-ink outline-none placeholder:text-subtle/60 focus:border-[#2383e2]"
            />
            <p className="mt-1.5 text-xs text-subtle">Edit event · {formatLongDate(task.date.slice(0, 10))}</p>
          </div>

          <div className="space-y-4 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-sm text-subtle">Time</span>
              <TimePicker value={time} onChange={setTime} />
            </div>

            <div className="flex items-start gap-3">
              <span className="w-16 shrink-0 pt-2 text-sm text-subtle">Notes</span>
              <textarea
                aria-label="Notes"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add notes"
                rows={3}
                className="flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-[#2383e2]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-line px-5 py-3">
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="rounded-md px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                Delete
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
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
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
