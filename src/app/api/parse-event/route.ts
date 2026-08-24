import { NextResponse } from "next/server";
import * as chrono from "chrono-node";
import { isValidDayKey, todayKey } from "@/lib/date";
import { isValidTime } from "@/lib/time";

export const runtime = "nodejs";

interface ParsedEvent {
  title: string;
  date: string;
  time: string;
  notes: string;
  source: "llm" | "fallback";
}

const SYSTEM_PROMPT = `You turn a short spoken phrase into a single calendar event.
Return ONLY strict JSON with these keys:
- "title": a concise event title (string)
- "date": the event date as "YYYY-MM-DD"
- "time": the start time as 24-hour "HH:MM"
- "notes": any extra detail, or "" if none
Resolve relative expressions ("today", "tonight", "tomorrow", "next Monday", "in an hour") using the provided current date/time. If no time is stated, use "09:00". If no date is stated, use the current date. Keep the title short; put reminders/extra detail in notes.`;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function deriveTitle(transcript: string, matched: string | null): string {
  let t = transcript;
  if (matched) t = t.split(matched).join(" ");
  t = t
    .replace(/\b(remind me to|remember to|please|schedule|add|create|set up|make|new event|event|appointment)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(to|a|an|the|at|on|for|about)\s+/i, "")
    .trim();
  if (!t) return "New event";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function fallbackParse(transcript: string, refKey: string, refTime: string): ParsedEvent {
  const ref = new Date(`${refKey}T${isValidTime(refTime) ? refTime : "12:00"}:00`);
  const results = chrono.parse(transcript, ref, { forwardDate: true });
  const r = results[0];

  let date = refKey;
  let time = "09:00";
  if (r) {
    const s = r.start;
    const y = s.get("year");
    const mo = s.get("month");
    const d = s.get("day");
    if (y && mo && d) date = `${y}-${pad(mo)}-${pad(d)}`;
    if (s.isCertain("hour")) {
      time = `${pad(s.get("hour") ?? 9)}:${pad(s.get("minute") ?? 0)}`;
    }
  }
  return {
    title: deriveTitle(transcript, r ? r.text : null),
    date: isValidDayKey(date) ? date : refKey,
    time: isValidTime(time) ? time : "09:00",
    notes: "",
    source: "fallback",
  };
}

async function llmParse(
  transcript: string,
  refKey: string,
  refTime: string,
  timezone: string,
): Promise<ParsedEvent | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "UTC",
  }).format(new Date(`${refKey}T00:00:00.000Z`));

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Current date: ${refKey} (${weekday}). Current local time: ${refTime}. Timezone: ${timezone || "unknown"}.\n\nPhrase: "${transcript}"`,
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return null;
    const parsed = JSON.parse(content) as Record<string, unknown>;

    const title = typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : "New event";
    const date = typeof parsed.date === "string" && isValidDayKey(parsed.date) ? parsed.date : refKey;
    const time = typeof parsed.time === "string" && isValidTime(parsed.time) ? parsed.time : "09:00";
    const notes = typeof parsed.notes === "string" ? parsed.notes.trim() : "";
    return { title, date, time, notes, source: "llm" };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const transcript = typeof data.transcript === "string" ? data.transcript.trim() : "";
  if (!transcript) {
    return NextResponse.json({ error: "No transcript provided" }, { status: 400 });
  }

  const refKey = typeof data.todayKey === "string" && isValidDayKey(data.todayKey) ? data.todayKey : todayKey();
  const refTime = typeof data.localTime === "string" && isValidTime(data.localTime) ? data.localTime : "12:00";
  const timezone = typeof data.timezone === "string" ? data.timezone : "";

  const parsed =
    (await llmParse(transcript, refKey, refTime, timezone)) ??
    fallbackParse(transcript, refKey, refTime);

  return NextResponse.json(parsed);
}
