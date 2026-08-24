"use client";

import { useEffect, useRef, useState } from "react";
import {
  addDaysKey,
  addMonthsKey,
  formatLongDate,
  monthLabel,
  relativeDayLabel,
  todayKey,
} from "@/lib/date";
import { timeString } from "@/lib/time";
import AddEventModal, { type EventPrefill, type NewEventPayload } from "./AddEventModal";
import DayView from "./DayView";
import MonthView from "./MonthView";
import SettingsMenu, { VOICE_AUTOADD_KEY } from "./SettingsMenu";
import VoiceCapture from "./VoiceCapture";

type View = "day" | "month";

export default function Agenda() {
  const [view, setView] = useState<View>("day");
  const [dateKey, setDateKey] = useState(todayKey());
  const [modalOpen, setModalOpen] = useState(false);
  const [prefill, setPrefill] = useState<EventPrefill | undefined>(undefined);
  const [version, setVersion] = useState(0);
  const [parsing, setParsing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isMonth = view === "month";
  const relative = !isMonth ? relativeDayLabel(dateKey) : null;

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }

  function goPrev() {
    setDateKey((k) => (isMonth ? addMonthsKey(k, -1) : addDaysKey(k, -1)));
  }
  function goNext() {
    setDateKey((k) => (isMonth ? addMonthsKey(k, 1) : addDaysKey(k, 1)));
  }

  async function createEvent(payload: NewEventPayload) {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return;
    setModalOpen(false);
    setPrefill(undefined);
    setVersion((v) => v + 1);
  }

  async function handleTranscript(text: string) {
    setParsing(true);
    try {
      const now = new Date();
      const res = await fetch("/api/parse-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: text,
          todayKey: todayKey(),
          localTime: timeString(now.getHours(), now.getMinutes()),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      if (!res.ok) {
        showToast("Sorry, couldn't understand that. Try again.");
        return;
      }
      const parsed = (await res.json()) as {
        title: string;
        date: string;
        time: string;
        notes: string;
      };

      let autoAdd = false;
      try {
        autoAdd = localStorage.getItem(VOICE_AUTOADD_KEY) === "true";
      } catch {
        /* ignore */
      }

      setDateKey(parsed.date);
      setView("day");

      if (autoAdd) {
        const createRes = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: parsed.title,
            date: parsed.date,
            time: parsed.time,
            description: parsed.notes,
            repeat: "none",
          }),
        });
        if (createRes.ok) {
          setVersion((v) => v + 1);
          showToast(`Added "${parsed.title}"`);
        } else {
          showToast("Couldn't save the event.");
        }
      } else {
        setPrefill({ title: parsed.title, time: parsed.time, notes: parsed.notes });
        setModalOpen(true);
      }
    } catch {
      showToast("Something went wrong. Try again.");
    } finally {
      setParsing(false);
    }
  }

  async function lock() {
    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <span className="flex items-center gap-2 text-sm font-semibold text-ink">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-[#2383e2] text-xs text-white">B</span>
          Backlog
        </span>
        <div className="flex items-center gap-1">
          <SettingsMenu />
          <button
            onClick={lock}
            title="Lock (sign out)"
            className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-subtle transition hover:bg-hover hover:text-ink"
          >
            Lock
          </button>
        </div>
      </div>

      <header className="mb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            {relative && (
              <p className="text-sm font-medium uppercase tracking-wide text-[#2383e2]">{relative}</p>
            )}
            <h1 className="text-3xl font-semibold tracking-tight text-ink">
              {isMonth ? "Calendar" : formatLongDate(dateKey)}
            </h1>
          </div>

          <div className="flex items-center gap-1">
            <button
              aria-label={isMonth ? "Previous month" : "Previous day"}
              onClick={goPrev}
              className="grid h-9 w-9 place-items-center rounded-md border border-line text-ink transition hover:bg-hover"
            >
              <ChevronLeft />
            </button>
            <button
              onClick={() => setDateKey(todayKey())}
              title={isMonth ? "Go to current month" : "Go to today"}
              className="min-w-[7rem] rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-hover"
            >
              {isMonth ? monthLabel(dateKey) : "Today"}
            </button>
            <button
              aria-label={isMonth ? "Next month" : "Next day"}
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

      {/* Voice quick capture */}
      <div className="mb-3">
        <VoiceCapture onTranscript={handleTranscript} busy={parsing} />
      </div>

      <button
        onClick={() => {
          setPrefill(undefined);
          setModalOpen(true);
        }}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line px-4 py-2.5 text-sm font-medium text-subtle transition hover:border-[#2383e2] hover:text-[#2383e2]"
      >
        <span className="text-lg leading-none">+</span> Add event manually
      </button>

      {toast && (
        <div className="mb-4 rounded-md border border-[#2383e2]/30 bg-[#2383e2]/10 px-4 py-2.5 text-sm text-ink">
          {toast}
        </div>
      )}

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
        <AddEventModal
          dateKey={dateKey}
          prefill={prefill}
          onClose={() => {
            setModalOpen(false);
            setPrefill(undefined);
          }}
          onCreate={createEvent}
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
