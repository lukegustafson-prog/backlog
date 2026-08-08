"use client";

import { useState } from "react";

interface QuickAddProps {
  dateKey: string;
  onAdded: () => void;
}

export default function QuickAdd({ dateKey, onAdded }: QuickAddProps) {
  const [open, setOpen] = useState(false);
  const [titles, setTitles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  async function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    setLoading(true);
    try {
      const res = await fetch("/api/tasks?recentTitles=8");
      setTitles(res.ok ? await res.json() : []);
    } catch {
      setTitles([]);
    } finally {
      setLoading(false);
    }
  }

  async function quickAdd(title: string) {
    setBusy(title);
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, kind: "task", date: dateKey, allDay: true, repeat: "none" }),
      });
      onAdded();
      setOpen(false);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={toggle}
        className={`flex h-full items-center gap-1.5 rounded-lg border px-4 py-3 text-sm font-medium transition ${
          open
            ? "border-[#2383e2] text-[#2383e2]"
            : "border-line text-subtle hover:border-[#2383e2] hover:text-[#2383e2]"
        }`}
      >
        <BoltIcon /> Quick add
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1 w-64 rounded-lg border border-line bg-surface p-1.5 shadow-xl">
            <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-subtle">
              Recently added tasks
            </p>
            {loading ? (
              <p className="px-2 py-2 text-sm text-subtle">Loading…</p>
            ) : titles.length === 0 ? (
              <p className="px-2 py-2 text-sm text-subtle">No recent tasks yet.</p>
            ) : (
              <ul className="max-h-72 overflow-auto">
                {titles.map((title) => (
                  <li key={title}>
                    <button
                      onClick={() => quickAdd(title)}
                      disabled={busy === title}
                      className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm text-ink transition hover:bg-hover disabled:opacity-50"
                    >
                      <span className="truncate">{title}</span>
                      <span className="shrink-0 text-xs text-subtle">{busy === title ? "…" : "+"}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function BoltIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
