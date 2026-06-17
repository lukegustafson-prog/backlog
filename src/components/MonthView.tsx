"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Task } from "@/lib/tasks";
import {
  addDaysKey,
  dayOfMonth,
  getUTCMonth,
  monthGridKeys,
  todayKey,
} from "@/lib/date";

interface MonthViewProps {
  dateKey: string;
  version: number;
  onSelectDay: (key: string) => void;
}

interface DayStat {
  total: number;
  completed: number;
}

const WEEKDAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Completion-based colour:
 * - no tasks → neutral
 * - >= 80% complete → green
 * - >= 50% complete → yellow
 * - otherwise (incl. 0%) → red
 */
function cellColor(stat: DayStat | undefined): string {
  if (!stat || stat.total === 0) return "bg-white";
  const ratio = stat.completed / stat.total;
  if (ratio >= 0.8) return "bg-green-100 hover:bg-green-200";
  if (ratio >= 0.5) return "bg-amber-100 hover:bg-amber-200";
  return "bg-red-100 hover:bg-red-200";
}

export default function MonthView({ dateKey, version, onSelectDay }: MonthViewProps) {
  const grid = useMemo(() => monthGridKeys(dateKey), [dateKey]);
  const currentMonth = useMemo(() => getUTCMonth(dateKey), [dateKey]);
  const today = todayKey();
  const [stats, setStats] = useState<Record<string, DayStat>>({});
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const from = grid[0];
    const to = addDaysKey(grid[grid.length - 1], 1);
    try {
      const res = await fetch(`/api/tasks?from=${from}&to=${to}`);
      if (!res.ok) throw new Error("failed");
      const tasks: Task[] = await res.json();
      const next: Record<string, DayStat> = {};
      for (const task of tasks) {
        if (task.kind !== "task") continue;
        const key = task.date.slice(0, 10);
        const stat = next[key] ?? { total: 0, completed: 0 };
        stat.total += 1;
        if (task.completed) stat.completed += 1;
        next[key] = stat;
      }
      setStats(next);
      setError(null);
    } catch {
      setError("Could not load the calendar. Is the server running?");
    }
  }, [grid]);

  useEffect(() => {
    load();
  }, [load, version]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-subtle">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-green-200" /> ≥ 80% done
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-amber-200" /> ≥ 50% done
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-red-200" /> &lt; 50% done
        </span>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-7 overflow-hidden rounded-lg border border-line text-sm">
        {WEEKDAY_HEADERS.map((label) => (
          <div
            key={label}
            className="border-b border-line bg-hover px-2 py-2 text-center text-xs font-medium uppercase tracking-wide text-subtle"
          >
            {label}
          </div>
        ))}

        {grid.map((key) => {
          const stat = stats[key];
          const inMonth = getUTCMonth(key) === currentMonth;
          const isToday = key === today;
          return (
            <button
              key={key}
              onClick={() => onSelectDay(key)}
              className={`relative min-h-[84px] border-b border-r border-line p-2 text-left transition ${cellColor(stat)} ${
                inMonth ? "" : "opacity-40"
              }`}
            >
              <span
                className={`inline-grid h-6 w-6 place-items-center rounded-full text-xs ${
                  isToday ? "bg-[#2383e2] font-semibold text-white" : "text-ink"
                }`}
              >
                {dayOfMonth(key)}
              </span>
              {stat && stat.total > 0 && (
                <span className="absolute bottom-2 left-2 text-[11px] font-medium text-ink/70">
                  {stat.completed}/{stat.total} done
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
