"use client";

import { useCallback, useEffect, useState } from "react";
import { REPEAT_LABELS, type Task } from "@/lib/tasks";

interface DayViewProps {
  dateKey: string;
  version: number;
  onChanged: () => void;
}

export default function DayView({ dateKey, version, onChanged }: DayViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const taskItems = tasks.filter((t) => t.kind === "task");
  const remaining = taskItems.filter((t) => !t.completed).length;

  async function toggleComplete(task: Task) {
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t)),
    );
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.completed }),
      });
      onChanged();
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

  return (
    <div>
      <p className="mb-4 text-sm text-subtle">
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

      {tasks.length > 0 && (
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="group flex items-start gap-3 px-4 py-3 transition hover:bg-hover"
            >
              {task.kind === "task" ? (
                <button
                  role="checkbox"
                  aria-checked={task.completed}
                  aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
                  onClick={() => toggleComplete(task)}
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border transition ${
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
                  className="mt-1 grid h-4 w-4 shrink-0 place-items-center"
                >
                  <span className="h-2.5 w-2.5 rounded-[3px] bg-[#9b59d0]" />
                </span>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {!task.allDay && task.time && (
                    <span className="shrink-0 rounded bg-hover px-1.5 py-0.5 text-xs font-medium text-subtle">
                      {task.time}
                    </span>
                  )}
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
              </div>

              <button
                aria-label="Delete"
                onClick={() => deleteTask(task)}
                className="shrink-0 rounded px-2 py-1 text-xs text-subtle opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
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
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}
