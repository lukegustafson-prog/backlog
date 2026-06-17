import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isKind, isRepeat, type Repeat, type CustomUnit, CUSTOM_UNITS } from "@/lib/tasks";
import { addDaysKey, dayKeyToDate, isValidDayKey } from "@/lib/date";
import { isValidTime } from "@/lib/time";
import { generateOccurrences, type OccurrenceSpec } from "@/lib/recurrence";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateKey = searchParams.get("date");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (dateKey) {
    if (!isValidDayKey(dateKey)) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    const tasks = await prisma.task.findMany({
      where: {
        date: { gte: dayKeyToDate(dateKey), lt: dayKeyToDate(addDaysKey(dateKey, 1)) },
      },
      orderBy: [{ allDay: "desc" }, { time: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(tasks);
  }

  if (from && to) {
    if (!isValidDayKey(from) || !isValidDayKey(to)) {
      return NextResponse.json({ error: "Invalid range" }, { status: 400 });
    }
    const tasks = await prisma.task.findMany({
      where: { date: { gte: dayKeyToDate(from), lt: dayKeyToDate(to) } },
      orderBy: [{ date: "asc" }, { allDay: "desc" }, { time: "asc" }],
    });
    return NextResponse.json(tasks);
  }

  const tasks = await prisma.task.findMany({
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });
  return NextResponse.json(tasks);
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

  const kind = isKind(data.kind) ? data.kind : "task";
  const repeat: Repeat = isRepeat(data.repeat) ? data.repeat : "none";

  let allDay: boolean;
  let time: string;
  if (kind === "event") {
    if (!isValidTime(data.time)) {
      return NextResponse.json({ error: "Events require a time" }, { status: 400 });
    }
    allDay = false;
    time = data.time;
  } else {
    allDay = data.allDay === undefined ? true : Boolean(data.allDay);
    time = !allDay && isValidTime(data.time) ? data.time : "";
  }

  if (repeat === "none") {
    const task = await prisma.task.create({
      data: { kind, title, date: dayKeyToDate(dateKey), allDay, time, repeat },
    });
    return NextResponse.json(task, { status: 201 });
  }

  const spec = specFromBody(data, repeat, dateKey);
  const keys = generateOccurrences(dateKey, spec);
  const seriesId = crypto.randomUUID();

  await prisma.task.createMany({
    data: keys.map((key) => ({
      seriesId,
      kind,
      title,
      date: dayKeyToDate(key),
      allDay,
      time,
      repeat,
    })),
  });

  const first = await prisma.task.findFirst({
    where: { seriesId },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(first, { status: 201 });
}
