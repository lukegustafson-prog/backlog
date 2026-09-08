"use client";

import { useEffect, useState } from "react";
import {
  SHOW_NOTES_KEY,
  THEME_KEY,
  TIMEZONE_KEY,
  VOICE_AUTOADD_KEY,
  readBool,
  writeBool,
  writeString,
} from "@/lib/settings";
import { US_TIMEZONES, deviceTimezone, savedTimezone } from "@/lib/timezone";

// Re-exported for existing imports.
export { VOICE_AUTOADD_KEY };

export default function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [autoAdd, setAutoAdd] = useState(false);
  const [showNotes, setShowNotes] = useState(true);
  const [timezone, setTimezone] = useState("");

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setAutoAdd(readBool(VOICE_AUTOADD_KEY, false));
    setShowNotes(readBool(SHOW_NOTES_KEY, true));
    setTimezone(savedTimezone());
  }, []);

  function setTheme(nextDark: boolean) {
    setDark(nextDark);
    document.documentElement.classList.toggle("dark", nextDark);
    try {
      localStorage.setItem(THEME_KEY, nextDark ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }

  function setVoiceAutoAdd(next: boolean) {
    setAutoAdd(next);
    writeBool(VOICE_AUTOADD_KEY, next);
  }

  function setNotesVisible(next: boolean) {
    setShowNotes(next);
    writeBool(SHOW_NOTES_KEY, next);
  }

  function setZone(next: string) {
    setTimezone(next);
    writeString(TIMEZONE_KEY, next);
  }

  return (
    <div className="relative">
      <button
        aria-label="Settings"
        title="Settings"
        onClick={() => setOpen((o) => !o)}
        className={`grid h-9 w-9 place-items-center rounded-md border transition ${
          open ? "border-[#2383e2] text-[#2383e2]" : "border-line text-subtle hover:bg-hover hover:text-ink"
        }`}
      >
        <GearIcon />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-72 rounded-lg border border-line bg-surface p-3 shadow-xl">
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-subtle">
              Settings
            </p>

            <Row label="Dark mode">
              <Switch checked={dark} onChange={() => setTheme(!dark)} ariaLabel="Dark mode" />
            </Row>

            <Row label="Show notes" hint="Show notes on events and forms">
              <Switch
                checked={showNotes}
                onChange={() => setNotesVisible(!showNotes)}
                ariaLabel="Show notes"
              />
            </Row>

            <Row label="Auto-add voice events" hint="Off: review before saving">
              <Switch
                checked={autoAdd}
                onChange={() => setVoiceAutoAdd(!autoAdd)}
                ariaLabel="Auto-add voice events"
              />
            </Row>

            <div className="rounded-md px-1 py-1.5">
              <p className="text-sm text-ink">Time zone</p>
              <select
                aria-label="Time zone"
                value={timezone}
                onChange={(e) => setZone(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-ink outline-none focus:border-[#2383e2]"
              >
                <option value="">Automatic ({deviceTimezone()})</option>
                {US_TIMEZONES.map((tz) => (
                  <option key={tz.id} value={tz.id}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md px-1 py-1.5">
      <div>
        <p className="text-sm text-ink">{label}</p>
        {hint && <p className="text-xs text-subtle">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function Switch({ checked, onChange, ariaLabel }: { checked: boolean; onChange: () => void; ariaLabel: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onChange}
      className={`relative h-5 w-9 shrink-0 rounded-full transition ${checked ? "bg-[#2383e2]" : "bg-line"}`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
          checked ? "left-[1.125rem]" : "left-0.5"
        }`}
      />
    </button>
  );
}

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
