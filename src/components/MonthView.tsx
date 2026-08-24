"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Task } from "@/lib/tasks";
import { addDaysKey, dayOfMonth, getUTCMonth, monthGridKeys, todayKey } from "@/lib/date";

interface MonthViewProps {
  dateKey: string;
  version: number;
  onSelectDay: (key: string) => void;
}

const WEEKDAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function MonthView({ dateKey, version, onSelectDay }: MonthViewProps) {
  const grid = useMemo(() => monthGridKeys(dateKey), [dateKey]);
  const currentMonth = useMemo(() => getUTCMonth(dateKey), [dateKey]);
  const today = todayKey();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const from = grid[0];
    const to = addDaysKey(grid[grid.length - 1], 1);
    try {
      const res = await fetch(`/api/tasks?from=${from}&to=${to}`);
      if (!res.ok) throw new Error("failed");
      const events: Task[] = await res.json();
      const next: Record<string, number> = {};
      for (const event of events) {
        const key = event.date.slice(0, 10);
        next[key] = (next[key] ?? 0) + 1;
      }
      setCounts(next);
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
          const count = counts[key] ?? 0;
          const inMonth = getUTCMonth(key) === currentMonth;
          const isToday = key === today;
          return (
            <button
              key={key}
              onClick={() => onSelectDay(key)}
              title={count > 0 ? `${count} event${count === 1 ? "" : "s"}` : undefined}
              className={`relative flex min-h-[52px] flex-col items-center gap-1 border-b border-r border-line px-1 py-1.5 transition hover:bg-hover ${
                count > 0 ? "bg-[#2383e2]/5" : "bg-surface"
              } ${inMonth ? "" : "opacity-40"}`}
            >
              <span
                className={`inline-grid h-6 w-6 place-items-center rounded-full text-xs ${
                  isToday ? "bg-[#2383e2] font-semibold text-white" : "text-ink"
                }`}
              >
                {dayOfMonth(key)}
              </span>
              {count > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] font-medium text-[#2383e2]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#2383e2]" />
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
