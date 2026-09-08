"use client";

/**
 * Client-side user preferences persisted in localStorage. Changes broadcast a
 * `SETTINGS_EVENT` so already-mounted components (e.g. the day view) can react
 * without a page reload.
 */

export const THEME_KEY = "backlog-theme";
export const VOICE_AUTOADD_KEY = "backlog-voice-autoadd";
export const SHOW_NOTES_KEY = "backlog-show-notes";
export const TIMEZONE_KEY = "backlog-timezone";

export const SETTINGS_EVENT = "backlog-settings-change";

function broadcast() {
  try {
    window.dispatchEvent(new Event(SETTINGS_EVENT));
  } catch {
    /* ignore */
  }
}

export function readBool(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    return v === "true";
  } catch {
    return fallback;
  }
}

export function writeBool(key: string, value: boolean) {
  try {
    localStorage.setItem(key, value ? "true" : "false");
  } catch {
    /* ignore */
  }
  broadcast();
}

export function readString(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeString(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
  broadcast();
}

/** Subscribe to preference changes (this tab and other tabs). */
export function onSettingsChange(cb: () => void): () => void {
  const handler = () => cb();
  window.addEventListener(SETTINGS_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(SETTINGS_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
