"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { REPEAT_LABELS, type Task } from "@/lib/tasks";
import { formatHour, formatTime, parseHour } from "@/lib/time";
import EditItemModal, { type EditPayload } from "./EditItemModal";

interface DayViewProps {
  dateKey: string;
  version: number;
  onChanged: () => void;
}

export default function DayView({ dateKey, version, onChanged }: DayViewProps) {
  const [events, setEvents] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Task | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks?date=${dateKey}`);
      if (!res.ok) throw new Error("failed");
      setEvents(await res.json());
      setError(null);
    } catch {
      setError("Could not load events. Is the server running?");
    } finally {
      setLoading(false);
    }
  }, [dateKey]);

  useEffect(() => {
    load();
  }, [load, version]);

  const hours = useMemo(() => {
    const itemHours = events
      .map((t) => parseHour(t.time))
      .filter((h): h is number => h !== null);
    const min = Math.max(0, Math.min(8, ...itemHours));
    const max = Math.min(23, Math.max(18, ...itemHours));
    return Array.from({ length: max - min + 1 }, (_, i) => min + i);
  }, [events]);

  const byHour = useMemo(() => {
    const map = new Map<number, Task[]>();
    for (const t of events) {
      const h = parseHour(t.time);
      if (h === null) continue;
      const list = map.get(h) ?? [];
      list.push(t);
      map.set(h, list);
    }
    return map;
  }, [events]);

  async function deleteEvent(event: Task) {
    const scope =
      event.seriesId &&
      window.confirm("This is a repeating event. Delete the entire series?")
        ? "series"
        : "one";
    setEvents((prev) => prev.filter((t) => t.id !== event.id));
    try {
      await fetch(`/api/tasks/${event.id}?scope=${scope}`, { method: "DELETE" });
      onChanged();
    } catch {
      await load();
    }
  }

  async function saveEdit(payload: EditPayload) {
    if (!editing) return;
    const id = editing.id;
    setEditing(null);
    try {
      await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: payload.title,
          description: payload.description,
          allDay: false,
          time: payload.time,
        }),
      });
      onChanged();
      await load();
    } catch {
      await load();
    }
  }

  return (
    <div>
      <p className="mb-5 text-sm text-subtle">
        {loading ? "Loading…" : `${events.length} event${events.length === 1 ? "" : "s"}`}
      </p>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && events.length === 0 && !error && (
        <div className="rounded-lg border border-line py-16 text-center">
          <p className="text-sm text-subtle">Nothing scheduled for this day.</p>
        </div>
      )}

      {!loading && events.length > 0 && (
        <div className="rounded-lg border border-line p-2">
          {hours.map((hour) => {
            const items = byHour.get(hour) ?? [];
            return (
              <div key={hour} className="flex gap-3">
                <div className="w-14 shrink-0 pt-2 text-right text-xs font-medium text-subtle">
                  {formatHour(hour)}
                </div>
                <div className="relative flex w-4 shrink-0 justify-center">
                  <span className="absolute inset-y-0 w-px bg-line" />
                  <span
                    className={`relative mt-[11px] h-2.5 w-2.5 rounded-full ring-2 ring-canvas ${
                      items.length > 0 ? "bg-[#2383e2]" : "bg-line"
                    }`}
                  />
                </div>
                <div className="min-h-[2.75rem] flex-1 space-y-2 py-1.5">
                  {items.map((event) => (
                    <div
                      key={event.id}
                      className="group flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2 transition hover:bg-hover"
                    >
                      <span aria-label="Event" className="mt-1 grid h-4 w-4 shrink-0 place-items-center self-start">
                        <span className="h-2.5 w-2.5 rounded-[3px] bg-[#9b59d0]" />
                      </span>

                      <span className="mt-0.5 shrink-0 self-start rounded bg-hover px-1.5 py-0.5 text-xs font-medium text-subtle">
                        {formatTime(event.time)}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm text-ink">{event.title}</span>
                          {event.repeat !== "none" && (
                            <span title={REPEAT_LABELS[event.repeat]} className="shrink-0 text-subtle">
                              <RepeatIcon />
                            </span>
                          )}
                        </div>
                        {event.description && (
                          <p className="mt-0.5 truncate text-xs text-subtle">{event.description}</p>
                        )}
                      </div>

                      <button
                        aria-label="Edit"
                        onClick={() => setEditing(event)}
                        className="shrink-0 rounded px-2 py-1 text-xs text-subtle opacity-0 transition hover:bg-hover hover:text-ink group-hover:opacity-100"
                      >
                        Edit
                      </button>
                      <button
                        aria-label="Delete"
                        onClick={() => deleteEvent(event)}
                        className="shrink-0 rounded px-2 py-1 text-xs text-subtle opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <EditItemModal task={editing} onClose={() => setEditing(null)} onSave={saveEdit} />
      )}
    </div>
  );
}

function RepeatIcon() {
  return (
    <svg className="inline-block align-text-bottom" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}
