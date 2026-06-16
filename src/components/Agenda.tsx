"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { REPEAT_LABELS, type Task } from "@/lib/tasks";
import {
  addDaysKey,
  formatLongDate,
  relativeDayLabel,
  todayKey,
} from "@/lib/date";
import AddTaskModal, { type NewTaskPayload } from "./AddTaskModal";

export default function Agenda() {
  const [dateKey, setDateKey] = useState(todayKey());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const loadTasks = useCallback(async (key: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks?date=${key}`);
      if (!res.ok) throw new Error("Failed to load tasks");
      setTasks(await res.json());
      setError(null);
    } catch {
      setError("Could not load tasks. Is the server running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks(dateKey);
  }, [dateKey, loadTasks]);

  const relative = useMemo(() => relativeDayLabel(dateKey), [dateKey]);
  const remaining = tasks.filter((t) => !t.completed).length;

  async function createTask(payload: NewTaskPayload) {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      setError("Could not create the task.");
      return;
    }
    setModalOpen(false);
    await loadTasks(dateKey);
  }

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
    } catch {
      await loadTasks(dateKey);
    }
  }

  async function deleteTask(task: Task) {
    const scope =
      task.seriesId &&
      window.confirm("This is a repeating task. Delete the entire series?")
        ? "series"
        : "one";
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    try {
      await fetch(`/api/tasks/${task.id}?scope=${scope}`, { method: "DELETE" });
    } catch {
      await loadTasks(dateKey);
    }
  }

  function openDatePicker() {
    const input = dateInputRef.current;
    if (!input) return;
    if (typeof input.showPicker === "function") input.showPicker();
    else input.focus();
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            {relative && (
              <p className="text-sm font-medium uppercase tracking-wide text-[#2383e2]">
                {relative}
              </p>
            )}
            <h1 className="text-3xl font-semibold tracking-tight text-ink">
              {formatLongDate(dateKey)}
            </h1>
            <p className="mt-1 text-sm text-subtle">
              {loading
                ? "Loading…"
                : `${tasks.length} task${tasks.length === 1 ? "" : "s"} · ${remaining} remaining`}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              aria-label="Previous day"
              onClick={() => setDateKey((k) => addDaysKey(k, -1))}
              className="grid h-9 w-9 place-items-center rounded-md border border-line text-ink transition hover:bg-hover"
            >
              <ChevronLeft />
            </button>
            <button
              onClick={() => setDateKey(todayKey())}
              className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-hover"
            >
              Today
            </button>
            <button
              aria-label="Next day"
              onClick={() => setDateKey((k) => addDaysKey(k, 1))}
              className="grid h-9 w-9 place-items-center rounded-md border border-line text-ink transition hover:bg-hover"
            >
              <ChevronRight />
            </button>
            <div className="relative">
              <button
                aria-label="Pick a date"
                onClick={openDatePicker}
                className="grid h-9 w-9 place-items-center rounded-md border border-line text-ink transition hover:bg-hover"
              >
                <CalendarIcon />
              </button>
              <input
                ref={dateInputRef}
                type="date"
                aria-label="Select date"
                value={dateKey}
                onChange={(e) => {
                  if (e.target.value) setDateKey(e.target.value);
                }}
                className="absolute bottom-0 left-0 h-0 w-0 opacity-0"
              />
            </div>
          </div>
        </div>
      </header>

      <button
        onClick={() => setModalOpen(true)}
        className="mb-4 flex w-full items-center gap-2 rounded-lg border border-dashed border-line px-4 py-3 text-left text-sm font-medium text-subtle transition hover:border-[#2383e2] hover:text-[#2383e2]"
      >
        <span className="text-lg leading-none">+</span> Add task
      </button>

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

      <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="group flex items-start gap-3 px-4 py-3 transition hover:bg-hover"
          >
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

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {!task.allDay && task.time && (
                  <span className="shrink-0 rounded bg-hover px-1.5 py-0.5 text-xs font-medium text-subtle">
                    {task.time}
                  </span>
                )}
                <span
                  className={`truncate text-sm ${
                    task.completed ? "text-subtle line-through" : "text-ink"
                  }`}
                >
                  {task.title}
                </span>
                {task.repeat !== "none" && (
                  <span
                    title={REPEAT_LABELS[task.repeat]}
                    className="shrink-0 text-subtle"
                  >
                    <RepeatIcon />
                  </span>
                )}
              </div>
              {task.description && (
                <p
                  className={`mt-0.5 truncate text-xs ${
                    task.completed ? "text-subtle/70 line-through" : "text-subtle"
                  }`}
                >
                  {task.description}
                </p>
              )}
            </div>

            <button
              aria-label="Delete task"
              onClick={() => deleteTask(task)}
              className="shrink-0 rounded px-2 py-1 text-xs text-subtle opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      {modalOpen && (
        <AddTaskModal
          dateKey={dateKey}
          onClose={() => setModalOpen(false)}
          onCreate={createTask}
        />
      )}
    </main>
  );
}

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
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
