"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface VoiceCaptureProps {
  onTranscript: (text: string) => void;
  busy?: boolean;
  label?: string;
}

// Minimal typing for the Web Speech API (not in the standard lib types).
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((event: {
    results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
  }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
};

const ERROR_MESSAGES: Record<string, string> = {
  "no-speech": "Didn't hear anything — try again and speak right after tapping.",
  "audio-capture": "No microphone was found on this device.",
  "not-allowed": "Microphone permission is blocked. Enable it in your browser settings.",
  "service-not-allowed": "Microphone permission is blocked. Enable it in your browser settings.",
  network: "Couldn't reach the speech service. Check your connection and try again.",
  aborted: "Voice input was cancelled.",
};

export default function VoiceCapture({ onTranscript, busy, label = "Speak to add event" }: VoiceCaptureProps) {
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [note, setNote] = useState<string | null>(null);

  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const cbRef = useRef(onTranscript);
  cbRef.current = onTranscript;
  const gotFinalRef = useRef(false);
  const errorRef = useRef(false);
  const heardRef = useRef("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  };

  // Deliver the best transcript we have exactly once, even if it only ever
  // arrived as interim results before an error/timeout. Returns true if it
  // salvaged something so callers can skip showing a destructive error.
  const deliverHeard = useCallback(() => {
    if (gotFinalRef.current) return true;
    const text = heardRef.current.trim();
    if (!text) return false;
    gotFinalRef.current = true;
    clearTimer();
    cbRef.current(text);
    return true;
  }, []);

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    const rec = new SR();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      gotFinalRef.current = false;
      errorRef.current = false;
      heardRef.current = "";
      setHeard("");
      setNote(null);
    };
    rec.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        const res = event.results[i];
        const text = res[0]?.transcript ?? "";
        if (res.isFinal) final += text;
        else interim += text;
      }
      const best = final || interim;
      heardRef.current = best;
      setHeard(best);
      if (final.trim()) {
        gotFinalRef.current = true;
        clearTimer();
        cbRef.current(final.trim());
        try {
          rec.stop();
        } catch {
          /* ignore */
        }
      }
    };
    rec.onerror = (event) => {
      errorRef.current = true;
      clearTimer();
      setListening(false);
      // If we already heard something, don't throw the transcript away just
      // because the engine reported an error afterward — use what we captured.
      if (deliverHeard()) return;
      const code = event?.error ?? "";
      setNote(ERROR_MESSAGES[code] ?? "Voice input failed. Try again, or type the event.");
    };
    rec.onend = () => {
      clearTimer();
      setListening(false);
      if (gotFinalRef.current) return;
      // No final result arrived, but if interim text was captured, use it.
      if (deliverHeard()) return;
      if (!errorRef.current) {
        setNote("Didn't catch that — try again, or type the event below.");
      }
    };
    recRef.current = rec;
    return () => {
      clearTimer();
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
    };
  }, [deliverHeard]);

  const toggle = useCallback(() => {
    const rec = recRef.current;
    if (!rec) return;
    if (listening) {
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
      setListening(false);
      clearTimer();
      return;
    }
    setNote(null);
    setHeard("");
    try {
      rec.start();
      setListening(true);
      // Safety net: if the engine never returns (some browsers accept the API
      // but never produce a result), don't hang in the "listening" state.
      clearTimer();
      timeoutRef.current = setTimeout(() => {
        if (!gotFinalRef.current) {
          try {
            rec.stop();
          } catch {
            /* ignore */
          }
          setListening(false);
          if (deliverHeard()) return;
          if (!errorRef.current) {
            setNote(
              "No response from the speech service. Your browser may not support voice input — try Chrome, or type the event below.",
            );
          }
        }
      }, 9000);
    } catch {
      setListening(false);
      clearTimer();
    }
  }, [listening, deliverHeard]);

  if (!supported) {
    return (
      <p className="rounded-lg border border-line bg-hover/40 px-4 py-3 text-xs text-subtle">
        Voice input isn&apos;t supported in this browser. Tip: use your phone keyboard&apos;s
        microphone in the title field, or open the site in Chrome.
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
          listening ? "animate-pulse bg-red-500" : "bg-[#2383e2] hover:opacity-90"
        }`}
      >
        <MicIcon />
        {busy ? "Thinking…" : listening ? "Listening… tap to stop" : label}
      </button>
      {listening && heard && (
        <p className="mt-2 text-xs text-subtle">Heard: “{heard}”</p>
      )}
      {note && <p className="mt-2 text-xs text-red-600">{note}</p>}
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}
