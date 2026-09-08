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
import { onSettingsChange, readBool, VOICE_AUTOADD_KEY } from "@/lib/settings";
import { effectiveTimezone, partsInZone } from "@/lib/timezone";
import AddEventModal, { type EventPrefill, type NewEventPayload } from "./AddEventModal";
import DayView from "./DayView";
import MonthView from "./MonthView";
import SettingsMenu from "./SettingsMenu";
import VoiceCapture from "./VoiceCapture";

type View = "day" | "month";

export default function Agenda() {
  const [view, setView] = useState<View>("day");
  const [dateKey, setDateKey] = useState(todayKey());
  const [today, setTodayState] = useState(todayKey());
  const [modalOpen, setModalOpen] = useState(false);
  const [prefill, setPrefill] = useState<EventPrefill | undefined>(undefined);
  const [version, setVersion] = useState(0);
  const [parsing, setParsing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isMonth = view === "month";
  const relative = !isMonth ? relativeDayLabel(dateKey, today) : null;

  // Resolve "today" in the user's selected zone after mount (localStorage isn't
  // available during SSR). Also open on the correct day for that zone.
  useEffect(() => {
    const tzToday = partsInZone(effectiveTimezone()).dateKey;
    setTodayState(tzToday);
    setDateKey(tzToday);
    return onSettingsChange(() => {
      setTodayState(partsInZone(effectiveTimezone()).dateKey);
    });
  }, []);

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

  function keepHeardText(text: string) {
    // Never lose what was heard: drop the user into the add form with the raw
    // transcript as the title so they can fix it instead of starting over.
    setView("day");
    setPrefill({ title: text });
    setModalOpen(true);
  }

  async function handleTranscript(text: string) {
    setParsing(true);
    try {
      const tz = effectiveTimezone();
      const { dateKey: tzToday, time: tzTime } = partsInZone(tz);
      const res = await fetch("/api/parse-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: text,
          todayKey: tzToday,
          localTime: tzTime,
          timezone: tz,
        }),
      });
      if (!res.ok) {
        showToast("Couldn't parse that automatically — here's what I heard.");
        keepHeardText(text);
        return;
      }
      const parsed = (await res.json()) as {
        title: string;
        date: string;
        time: string;
        notes: string;
      };

      const autoAdd = readBool(VOICE_AUTOADD_KEY, false);

      if (autoAdd) {
        // Create first, THEN move the view + refresh once, so there's a single
        // reload with fresh data (no racing pre-create fetch).
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
          setDateKey(parsed.date);
          setView("day");
          setVersion((v) => v + 1);
          showToast(`Added "${parsed.title}"`);
        } else {
          showToast("Couldn't save the event.");
        }
      } else {
        setDateKey(parsed.date);
        setView("day");
        setPrefill({ title: parsed.title, time: parsed.time, notes: parsed.notes });
        setModalOpen(true);
      }
    } catch {
      showToast("Something went wrong — here's what I heard.");
      keepHeardText(text);
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
    <main className="mx-auto flex w-full max-w-[393px] flex-col">
      <div className="sticky top-0 z-20 border-b border-line bg-canvas px-4 pb-2.5 pt-3">
        <div className="mb-2.5 flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-sm font-semibold text-ink">
            <span className="grid h-5 w-5 place-items-center rounded-md bg-[#2383e2] text-[10px] text-white">B</span>
            Backlog
          </span>
          <div className="flex items-center gap-1">
            <SettingsMenu />
            <button
              onClick={lock}
              title="Lock (sign out)"
              className="touch-manipulation rounded-md border border-line px-3 py-1.5 text-sm font-medium text-subtle transition hover:bg-hover hover:text-ink active:bg-hover"
            >
              Lock
            </button>
          </div>
        </div>

        <header className="mb-2.5 flex items-end justify-between gap-2">
          <div className="min-w-0">
            {relative && (
              <p className="text-[11px] font-medium uppercase tracking-wide text-[#2383e2]">{relative}</p>
            )}
            <h1 className="truncate text-base font-semibold tracking-tight text-ink">
              {isMonth ? "Calendar" : formatLongDate(dateKey)}
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              aria-label={isMonth ? "Previous month" : "Previous day"}
              onClick={goPrev}
              className="grid h-9 w-9 touch-manipulation place-items-center rounded-md border border-line text-ink transition hover:bg-hover active:bg-hover"
            >
              <ChevronLeft />
            </button>
            <button
              onClick={() => setDateKey(today)}
              title={isMonth ? "Go to current month" : "Go to today"}
              className="min-w-[5.5rem] touch-manipulation rounded-md border border-line px-2.5 py-1.5 text-sm font-medium text-ink transition hover:bg-hover active:bg-hover"
            >
              {isMonth ? monthLabel(dateKey) : "Today"}
            </button>
            <button
              aria-label={isMonth ? "Next month" : "Next day"}
              onClick={goNext}
              className="grid h-9 w-9 touch-manipulation place-items-center rounded-md border border-line text-ink transition hover:bg-hover active:bg-hover"
            >
              <ChevronRight />
            </button>
            <button
              aria-label={view === "day" ? "Switch to calendar view" : "Switch to day view"}
              title={view === "day" ? "Calendar view" : "Day view"}
              onClick={() => setView((v) => (v === "day" ? "month" : "day"))}
              className={`grid h-9 w-9 touch-manipulation place-items-center rounded-md border transition ${
                view === "month"
                  ? "border-[#2383e2] bg-[#2383e2]/10 text-[#2383e2]"
                  : "border-line text-ink hover:bg-hover active:bg-hover"
              }`}
            >
              {view === "day" ? <CalendarIcon /> : <ListIcon />}
            </button>
          </div>
        </header>

        {/* Voice quick capture */}
        <div className="mb-2 flex items-start gap-2">
          <div className="flex-1">
            <VoiceCapture onTranscript={handleTranscript} busy={parsing} label="Speak to add" />
          </div>
          <button
            onClick={() => {
              setPrefill(undefined);
              setModalOpen(true);
            }}
            aria-label="Add event manually"
            title="Add event manually"
            className="grid h-11 w-12 shrink-0 touch-manipulation place-items-center rounded-lg border border-dashed border-line text-lg font-medium text-subtle transition hover:border-[#2383e2] hover:text-[#2383e2] active:bg-hover"
          >
            +
          </button>
        </div>
      </div>

      <div className="px-4 pb-8 pt-3">
        {toast && (
          <div className="mb-3 rounded-md border border-[#2383e2]/30 bg-[#2383e2]/10 px-4 py-2.5 text-sm text-ink">
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
      </div>

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
