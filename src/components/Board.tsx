"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  PRIORITIES,
  PRIORITY_LABELS,
  STATUS_LABELS,
  STATUSES,
  type Priority,
  type Status,
  type Task,
} from "@/lib/tasks";

const priorityStyles: Record<Priority, string> = {
  low: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
  high: "bg-rose-500/15 text-rose-300 border border-rose-500/30",
};

const columnAccent: Record<Status, string> = {
  backlog: "border-slate-500",
  todo: "border-sky-500",
  in_progress: "border-violet-500",
  done: "border-emerald-500",
};

export default function Board() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [submitting, setSubmitting] = useState(false);

  const loadTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
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
    loadTasks();
  }, [loadTasks]);

  const grouped = useMemo(() => {
    const map: Record<Status, Task[]> = {
      backlog: [],
      todo: [],
      in_progress: [],
      done: [],
    };
    for (const task of tasks) {
      if (map[task.status]) map[task.status].push(task);
    }
    return map;
  }, [tasks]);

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, priority, status: "backlog" }),
      });
      if (!res.ok) throw new Error("create failed");
      setTitle("");
      setDescription("");
      setPriority("medium");
      await loadTasks();
    } catch {
      setError("Could not create the task.");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateTask(id: string, patch: Partial<Pick<Task, "status" | "priority">>) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    );
    try {
      await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    } catch {
      await loadTasks();
    }
  }

  async function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    } catch {
      await loadTasks();
    }
  }

  function moveTask(task: Task, direction: -1 | 1) {
    const idx = STATUSES.indexOf(task.status);
    const next = STATUSES[idx + direction];
    if (next) updateTask(task.id, { status: next });
  }

  const total = tasks.length;
  const completed = grouped.done.length;

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-8">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-600 text-2xl shadow-lg shadow-violet-900/40">
            🗂️
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Backlog</h1>
            <p className="text-sm text-slate-400">
              {total} task{total === 1 ? "" : "s"} · {completed} done
            </p>
          </div>
        </div>
      </header>

      <form
        onSubmit={createTask}
        className="mb-10 grid gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5 backdrop-blur md:grid-cols-[2fr_3fr_auto_auto]"
      >
        <input
          aria-label="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-violet-500"
        />
        <input
          aria-label="Task description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add an optional description"
          className="rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-violet-500"
        />
        <select
          aria-label="Task priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          className="rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-violet-500"
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABELS[p]} priority
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Adding…" : "Add task"}
        </button>
      </form>

      {error && (
        <div className="mb-6 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-400">Loading board…</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {STATUSES.map((status) => (
            <section
              key={status}
              className={`rounded-2xl border-t-4 ${columnAccent[status]} bg-slate-900/50 p-4`}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                  {STATUS_LABELS[status]}
                </h2>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                  {grouped[status].length}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {grouped[status].length === 0 && (
                  <p className="rounded-lg border border-dashed border-slate-700 px-3 py-6 text-center text-xs text-slate-500">
                    No tasks
                  </p>
                )}
                {grouped[status].map((task) => (
                  <article
                    key={task.id}
                    className="group rounded-xl border border-slate-700/70 bg-slate-950/70 p-3 shadow-sm transition hover:border-slate-500"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="text-sm font-medium leading-snug text-slate-100">
                        {task.title}
                      </h3>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${priorityStyles[task.priority]}`}
                      >
                        {PRIORITY_LABELS[task.priority]}
                      </span>
                    </div>
                    {task.description && (
                      <p className="mb-3 text-xs leading-relaxed text-slate-400">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        <button
                          aria-label="Move left"
                          onClick={() => moveTask(task, -1)}
                          disabled={STATUSES.indexOf(task.status) === 0}
                          className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 transition hover:bg-slate-800 disabled:opacity-30"
                        >
                          ←
                        </button>
                        <button
                          aria-label="Move right"
                          onClick={() => moveTask(task, 1)}
                          disabled={STATUSES.indexOf(task.status) === STATUSES.length - 1}
                          className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 transition hover:bg-slate-800 disabled:opacity-30"
                        >
                          →
                        </button>
                      </div>
                      <button
                        aria-label="Delete task"
                        onClick={() => deleteTask(task.id)}
                        className="rounded-md px-2 py-1 text-xs text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-300"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
