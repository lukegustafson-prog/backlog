"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { REPEAT_LABELS, type Task } from "@/lib/tasks";
import { formatHour, formatTime, parseHour } from "@/lib/time";
import TimePicker from "./TimePicker";
import EditItemModal, { type EditPayload } from "./EditItemModal";

interface DayViewProps {
  dateKey: string;
  version: number;
  onChanged: () => void;
}

function isScheduled(task: Task): boolean {
  return !task.allDay && parseHour(task.time) !== null;
}

export default function DayView({ dateKey, version, onChanged }: DayViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inline "assign to time" picker state
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assignTime, setAssignTime] = useState("09:00");

  // Edit modal
  const [editing, setEditing] = useState<Task | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks?date=${dateKey}`);
      if (!res.ok) throw new Error("failed");
      setTasks(await res.json());
      setError(null);
    } catch {
      setError("Could not load tasks. Is the server running?");
    } finally {
      setLoading(false);
    }
  }, [dateKey]);

  useEffect(() => {
    load();
  }, [load, version]);

  const unscheduled = tasks.filter((t) => t.kind === "task" && !isScheduled(t));
  const scheduled = tasks.filter(isScheduled);
  const taskItems = tasks.filter((t) => t.kind === "task");
  const remaining = taskItems.filter((t) => !t.completed).length;

  const hours = useMemo(() => {
    const itemHours = scheduled
      .map((t) => parseHour(t.time))
      .filter((h): h is number => h !== null);
    const min = Math.max(0, Math.min(8, ...itemHours));
    const max = Math.min(23, Math.max(18, ...itemHours));
    return Array.from({ length: max - min + 1 }, (_, i) => min + i);
  }, [scheduled]);

  const byHour = useMemo(() => {
    const map = new Map<number, Task[]>();
    for (const t of scheduled) {
      const h = parseHour(t.time)!;
      const list = map.get(h) ?? [];
      list.push(t);
      map.set(h, list);
    }
    return map;
  }, [scheduled]);

  async function patch(id: string, body: Record<string, unknown>) {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    onChanged();
  }

  async function toggleComplete(task: Task) {
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t)),
    );
    try {
      await patch(task.id, { completed: !task.completed });
    } catch {
      await load();
    }
  }

  async function deleteTask(task: Task) {
    const scope =
      task.seriesId &&
      window.confirm("This is a repeating item. Delete the entire series?")
        ? "series"
        : "one";
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    try {
      await fetch(`/api/tasks/${task.id}?scope=${scope}`, { method: "DELETE" });
      onChanged();
    } catch {
      await load();
    }
  }

  function startAssign(task: Task) {
    setAssigningId(task.id);
    setAssignTime("09:00");
  }

  async function confirmAssign(task: Task) {
    const time = assignTime;
    setAssigningId(null);
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, allDay: false, time } : t)),
    );
    try {
      await patch(task.id, { allDay: false, time });
    } catch {
      await load();
    }
  }

  async function saveEdit(payload: EditPayload) {
    if (!editing) return;
    const id = editing.id;
    setEditing(null);
    try {
      await patch(id, {
        title: payload.title,
        description: payload.description,
        allDay: payload.allDay,
        time: payload.time,
      });
      await load();
    } catch {
      await load();
    }
  }

  function EditButton({ task }: { task: Task }) {
    return (
      <button
        aria-label="Edit"
        onClick={() => setEditing(task)}
        className="shrink-0 rounded px-2 py-1 text-xs text-subtle opacity-0 transition hover:bg-hover hover:text-ink group-hover:opacity-100"
      >
        Edit
      </button>
    );
  }

  function DeleteButton({ task }: { task: Task }) {
    return (
      <button
        aria-label="Delete"
        onClick={() => deleteTask(task)}
        className="shrink-0 rounded px-2 py-1 text-xs text-subtle opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
      >
        Delete
      </button>
    );
  }

  return (
    <div>
      <p className="mb-5 text-sm text-subtle">
        {loading
          ? "Loading…"
          : `${tasks.length} item${tasks.length === 1 ? "" : "s"}` +
            (taskItems.length > 0 ? ` · ${remaining} task${remaining === 1 ? "" : "s"} remaining` : "")}
      </p>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && tasks.length === 0 && !error && (
        <div className="rounded-lg border border-line py-16 text-center">
          <p className="text-sm text-subtle">Nothing scheduled for this day.</p>
        </div>
      )}

      {/* Unscheduled tasks sit above the timeline */}
      {unscheduled.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-subtle">
            Tasks to schedule
          </h2>
          <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
            {unscheduled.map((task) => (
              <li
                key={task.id}
                className="group flex items-center gap-3 px-4 py-3 transition hover:bg-hover"
              >
                <button
                  role="checkbox"
                  aria-checked={task.completed}
                  aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
                  onClick={() => toggleComplete(task)}
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center self-start rounded-full border transition ${
                    task.completed
                      ? "border-[#2383e2] bg-[#2383e2] text-white"
                      : "border-subtle/50 text-transparent hover:border-[#2383e2]"
                  }`}
                >
                  <CheckIcon />
                </button>

                <div className="min-w-0 flex-1">
                  <span
                    className={`block truncate text-sm ${
                      task.completed ? "text-subtle line-through" : "text-ink"
                    }`}
                  >
                    {task.title}
                    {task.repeat !== "none" && (
                      <span title={REPEAT_LABELS[task.repeat]} className="ml-2 inline-block text-subtle">
                        <RepeatIcon />
                      </span>
                    )}
                  </span>
                  {task.description && (
                    <p className="mt-0.5 truncate text-xs text-subtle">{task.description}</p>
                  )}
                </div>

                {assigningId === task.id ? (
                  <div className="flex items-center gap-1">
                    <TimePicker value={assignTime} onChange={setAssignTime} />
                    <button
                      onClick={() => confirmAssign(task)}
                      className="rounded-md bg-[#2383e2] px-2 py-1 text-xs font-medium text-white transition hover:opacity-90"
                    >
                      Set
                    </button>
                    <button
                      aria-label="Cancel"
                      onClick={() => setAssigningId(null)}
                      className="rounded-md px-2 py-1 text-xs text-subtle transition hover:bg-hover"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startAssign(task)}
                    className="shrink-0 rounded-md border border-line px-2.5 py-1 text-xs font-medium text-ink transition hover:border-[#2383e2] hover:text-[#2383e2]"
                  >
                    Assign to time
                  </button>
                )}

                <EditButton task={task} />
                <DeleteButton task={task} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Vertical timeline */}
      {!loading && tasks.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-subtle">
            Timeline
          </h2>
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
                    {items.map((task) => (
                      <div
                        key={task.id}
                        className="group flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2 transition hover:bg-hover"
                      >
                        {task.kind === "task" ? (
                          <button
                            role="checkbox"
                            aria-checked={task.completed}
                            aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
                            onClick={() => toggleComplete(task)}
                            className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center self-start rounded-full border transition ${
                              task.completed
                                ? "border-[#2383e2] bg-[#2383e2] text-white"
                                : "border-subtle/50 text-transparent hover:border-[#2383e2]"
                            }`}
                          >
                            <CheckIcon />
                          </button>
                        ) : (
                          <span
                            aria-label="Event"
                            className="mt-1 grid h-4 w-4 shrink-0 place-items-center self-start"
                          >
                            <span className="h-2.5 w-2.5 rounded-[3px] bg-[#9b59d0]" />
                          </span>
                        )}

                        <span className="mt-0.5 shrink-0 self-start rounded bg-hover px-1.5 py-0.5 text-xs font-medium text-subtle">
                          {formatTime(task.time)}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`truncate text-sm ${
                                task.kind === "task" && task.completed
                                  ? "text-subtle line-through"
                                  : "text-ink"
                              }`}
                            >
                              {task.title}
                            </span>
                            {task.kind === "event" && (
                              <span className="shrink-0 rounded bg-[#9b59d0]/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#7d3cb5]">
                                Event
                              </span>
                            )}
                            {task.repeat !== "none" && (
                              <span title={REPEAT_LABELS[task.repeat]} className="shrink-0 text-subtle">
                                <RepeatIcon />
                              </span>
                            )}
                          </div>
                          {task.description && (
                            <p className="mt-0.5 truncate text-xs text-subtle">{task.description}</p>
                          )}
                        </div>

                        <EditButton task={task} />
                        <DeleteButton task={task} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {editing && (
        <EditItemModal task={editing} onClose={() => setEditing(null)} onSave={saveEdit} />
      )}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
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
