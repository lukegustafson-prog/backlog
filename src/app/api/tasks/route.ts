import { NextResponse } from "next/server";
import { isRepeat, type Repeat, type CustomUnit, CUSTOM_UNITS } from "@/lib/tasks";
import { prisma } from "@/lib/prisma";
import { addDaysKey, dayKeyToDate, isValidDayKey } from "@/lib/date";
import { isValidTime } from "@/lib/time";
import { generateOccurrences, type OccurrenceSpec } from "@/lib/recurrence";

// Every row is a timed event.
const EVENT_WHERE = { kind: "event" as const };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateKey = searchParams.get("date");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (dateKey) {
    if (!isValidDayKey(dateKey)) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    const events = await prisma.task.findMany({
      where: {
        ...EVENT_WHERE,
        date: { gte: dayKeyToDate(dateKey), lt: dayKeyToDate(addDaysKey(dateKey, 1)) },
      },
      orderBy: [{ time: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(events);
  }

  if (from && to) {
    if (!isValidDayKey(from) || !isValidDayKey(to)) {
      return NextResponse.json({ error: "Invalid range" }, { status: 400 });
    }
    const events = await prisma.task.findMany({
      where: { ...EVENT_WHERE, date: { gte: dayKeyToDate(from), lt: dayKeyToDate(to) } },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    });
    return NextResponse.json(events);
  }

  const events = await prisma.task.findMany({
    where: EVENT_WHERE,
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });
  return NextResponse.json(events);
}

function specFromBody(data: Record<string, unknown>, repeat: Repeat, startKey: string): OccurrenceSpec {
  if (repeat === "custom") {
    const custom = (data.custom ?? {}) as Record<string, unknown>;
    const unit: CustomUnit = CUSTOM_UNITS.includes(custom.unit as CustomUnit)
      ? (custom.unit as CustomUnit)
      : "week";
    const weekdays = Array.isArray(custom.weekdays)
      ? custom.weekdays
          .map((d) => Number(d))
          .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
      : [];
    const endType = custom.endType === "until" ? "until" : "count";
    return {
      unit,
      interval: Number(custom.interval) || 1,
      weekdays,
      endType,
      count: Number(custom.count) || 10,
      until: typeof custom.until === "string" && isValidDayKey(custom.until) ? custom.until : startKey,
    };
  }

  const occurrences = Number(data.occurrences);
  const count = Number.isFinite(occurrences) ? occurrences : 10;
  const unit: CustomUnit = repeat === "monthly" ? "month" : "day";
  const interval = repeat === "weekly" ? 7 : 1;
  return { unit, interval, weekdays: [], endType: "count", count, until: startKey };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const title = typeof data.title === "string" ? data.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const dateKey = typeof data.date === "string" ? data.date : "";
  if (!isValidDayKey(dateKey)) {
    return NextResponse.json({ error: "A valid date is required" }, { status: 400 });
  }

  if (!isValidTime(data.time)) {
    return NextResponse.json({ error: "A valid time is required" }, { status: 400 });
  }
  const time = data.time as string;
  const description = typeof data.description === "string" ? data.description.trim() : "";
  const repeat: Repeat = isRepeat(data.repeat) ? data.repeat : "none";

  const base = { kind: "event", title, description, allDay: false, time, repeat };

  if (repeat === "none") {
    const event = await prisma.task.create({
      data: { ...base, date: dayKeyToDate(dateKey) },
    });
    return NextResponse.json(event, { status: 201 });
  }

  const spec = specFromBody(data, repeat, dateKey);
  const keys = generateOccurrences(dateKey, spec);
  const seriesId = crypto.randomUUID();

  await prisma.task.createMany({
    data: keys.map((key) => ({ ...base, seriesId, date: dayKeyToDate(key) })),
  });

  const first = await prisma.task.findFirst({
    where: { seriesId },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(first, { status: 201 });
}
