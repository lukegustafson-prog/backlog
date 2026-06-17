"use client";

import { useState } from "react";
import {
  addDaysKey,
  addMonthsKey,
  formatLongDate,
  monthLabel,
  relativeDayLabel,
  todayKey,
} from "@/lib/date";
import AddTaskModal, { type NewTaskPayload } from "./AddTaskModal";
import DayView from "./DayView";
import MonthView from "./MonthView";

type View = "day" | "month";

export default function Agenda() {
  const [view, setView] = useState<View>("day");
  const [dateKey, setDateKey] = useState(todayKey());
  const [modalOpen, setModalOpen] = useState(false);
  const [version, setVersion] = useState(0);

  const relative = view === "day" ? relativeDayLabel(dateKey) : null;

  function goPrev() {
    setDateKey((k) => (view === "day" ? addDaysKey(k, -1) : addMonthsKey(k, -1)));
  }
  function goNext() {
    setDateKey((k) => (view === "day" ? addDaysKey(k, 1) : addMonthsKey(k, 1)));
  }

  async function createTask(payload: NewTaskPayload) {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return;
    setModalOpen(false);
    setVersion((v) => v + 1);
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            {relative && (
              <p className="text-sm font-medium uppercase tracking-wide text-[#2383e2]">
                {relative}
              </p>
            )}
            <h1 className="text-3xl font-semibold tracking-tight text-ink">
              {view === "day" ? formatLongDate(dateKey) : monthLabel(dateKey)}
            </h1>
          </div>

          <div className="flex items-center gap-1">
            <button
              aria-label={view === "day" ? "Previous day" : "Previous month"}
              onClick={goPrev}
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
              aria-label={view === "day" ? "Next day" : "Next month"}
              onClick={goNext}
              className="grid h-9 w-9 place-items-center rounded-md border border-line text-ink transition hover:bg-hover"
            >
              <ChevronRight />
            </button>
            <button
              aria-label={view === "day" ? "Switch to calendar view" : "Switch to day view"}
              title={view === "day" ? "Calendar view" : "Day view"}
              onClick={() => setView((v) => (v === "day" ? "month" : "day"))}
              className={`grid h-9 w-9 place-items-center rounded-md border transition ${
                view === "month"
                  ? "border-[#2383e2] bg-[#2383e2]/10 text-[#2383e2]"
                  : "border-line text-ink hover:bg-hover"
              }`}
            >
              {view === "day" ? <CalendarIcon /> : <ListIcon />}
            </button>
          </div>
        </div>
      </header>

      <button
        onClick={() => setModalOpen(true)}
        className="mb-4 flex w-full items-center gap-2 rounded-lg border border-dashed border-line px-4 py-3 text-left text-sm font-medium text-subtle transition hover:border-[#2383e2] hover:text-[#2383e2]"
      >
        <span className="text-lg leading-none">+</span> Add task or event
      </button>

      {view === "day" ? (
        <DayView dateKey={dateKey} version={version} onChanged={() => setVersion((v) => v + 1)} />
      ) : (
        <MonthView
          dateKey={dateKey}
          version={version}
          onSelectDay={(key) => {
            setDateKey(key);
            setView("day");
          }}
        />
      )}

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

function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}
