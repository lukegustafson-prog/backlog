"use client";

import { useEffect, useState } from "react";
import { FEELINGS, FEELING_WITH_FOLLOWUP, type Feeling } from "@/lib/symptoms";
import { formatLongDate } from "@/lib/date";
import { timeString } from "@/lib/time";
import TimePicker from "./TimePicker";

export interface NewSymptomPayload {
  feeling: Feeling;
  date: string;
  time: string;
  volume: number | null;
  emptied: boolean | null;
}

interface AddSymptomModalProps {
  dateKey: string;
  onClose: () => void;
  onCreate: (payload: NewSymptomPayload) => Promise<void>;
}

export default function AddSymptomModal({ dateKey, onClose, onCreate }: AddSymptomModalProps) {
  const nowDate = new Date();
  const [feeling, setFeeling] = useState<Feeling>("need_poop");
  const [time, setTime] = useState(timeString(nowDate.getHours(), nowDate.getMinutes()));
  const [volume, setVolume] = useState(5);
  const [emptied, setEmptied] = useState(true);
  const [saving, setSaving] = useState(false);

  const showFollowUp = feeling === FEELING_WITH_FOLLOWUP;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await onCreate({
        feeling,
        date: dateKey,
        time,
        volume: showFollowUp ? volume : null,
        emptied: showFollowUp ? emptied : null,
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
        className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-line"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="border-b border-line px-5 pb-4 pt-5">
            <h2 className="text-xl font-medium text-ink">Log a symptom</h2>
            <p className="mt-1 text-sm text-subtle">{formatLongDate(dateKey)}</p>
          </div>

          <div className="space-y-4 px-5 py-4">
            <div>
              <label className="mb-1 block text-sm text-subtle">What are you feeling?</label>
              <select
                aria-label="What are you feeling?"
                value={feeling}
                onChange={(e) => setFeeling(e.target.value as Feeling)}
                className="w-full rounded-md border border-line bg-white px-2 py-2 text-sm text-ink outline-none focus:border-[#2383e2]"
              >
                {FEELINGS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {showFollowUp && (
              <div className="space-y-4 rounded-lg border border-line bg-hover/40 p-3">
                <div>
                  <label className="mb-1 block text-sm text-subtle">
                    From 1 to 10, what is the volume?
                  </label>
                  <select
                    aria-label="Volume"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-full rounded-md border border-line bg-white px-2 py-2 text-sm text-ink outline-none focus:border-[#2383e2]"
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-subtle">Do you feel emptied?</label>
                  <select
                    aria-label="Do you feel emptied?"
                    value={emptied ? "yes" : "no"}
                    onChange={(e) => setEmptied(e.target.value === "yes")}
                    className="w-full rounded-md border border-line bg-white px-2 py-2 text-sm text-ink outline-none focus:border-[#2383e2]"
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-sm text-subtle">Time</span>
              <TimePicker value={time} onChange={setTime} />
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
              disabled={saving}
              className="rounded-md bg-[#2383e2] px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save symptom"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
