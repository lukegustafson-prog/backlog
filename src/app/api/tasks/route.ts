import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isRepeat, type Repeat } from "@/lib/tasks";
import { addDaysKey, addMonthsKey, dayKeyToDate, isValidDayKey } from "@/lib/date";

const MAX_OCCURRENCES = 60;

function buildSeriesKeys(startKey: string, repeat: Repeat, count: number): string[] {
  const keys: string[] = [];
  let current = startKey;
  for (let i = 0; i < count; i++) {
    keys.push(current);
    if (repeat === "daily") current = addDaysKey(current, 1);
    else if (repeat === "weekly") current = addDaysKey(current, 7);
    else if (repeat === "monthly") current = addMonthsKey(current, 1);
  }
  return keys;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateKey = searchParams.get("date");

  if (dateKey) {
    if (!isValidDayKey(dateKey)) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    const start = dayKeyToDate(dateKey);
    const end = dayKeyToDate(addDaysKey(dateKey, 1));
    const tasks = await prisma.task.findMany({
      where: { date: { gte: start, lt: end } },
      orderBy: [{ allDay: "desc" }, { time: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(tasks);
  }

  const tasks = await prisma.task.findMany({
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });
  return NextResponse.json(tasks);
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

  const description =
    typeof data.description === "string" ? data.description.trim() : "";
  const repeat: Repeat = isRepeat(data.repeat) ? data.repeat : "none";
  const allDay = data.allDay === undefined ? true : Boolean(data.allDay);
  const time = !allDay && typeof data.time === "string" ? data.time : "";

  let occurrences = 1;
  if (repeat !== "none") {
    const requested = Number(data.occurrences);
    occurrences = Number.isFinite(requested)
      ? Math.min(Math.max(Math.trunc(requested), 1), MAX_OCCURRENCES)
      : 10;
  }

  if (repeat === "none") {
    const task = await prisma.task.create({
      data: {
        title,
        description,
        date: dayKeyToDate(dateKey),
        allDay,
        time,
        repeat,
      },
    });
    return NextResponse.json(task, { status: 201 });
  }

  const seriesId = crypto.randomUUID();
  const keys = buildSeriesKeys(dateKey, repeat, occurrences);
  await prisma.task.createMany({
    data: keys.map((key) => ({
      seriesId,
      title,
      description,
      date: dayKeyToDate(key),
      allDay,
      time,
      repeat,
    })),
  });

  const first = await prisma.task.findFirst({
    where: { seriesId, date: dayKeyToDate(dateKey) },
  });
  return NextResponse.json(first, { status: 201 });
}
