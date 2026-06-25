import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isFeeling, FEELING_WITH_FOLLOWUP } from "@/lib/symptoms";
import { addDaysKey, dayKeyToDate, isValidDayKey } from "@/lib/date";
import { isValidTime } from "@/lib/time";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateKey = searchParams.get("date");

  if (dateKey) {
    if (!isValidDayKey(dateKey)) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    const symptoms = await prisma.symptom.findMany({
      where: {
        date: { gte: dayKeyToDate(dateKey), lt: dayKeyToDate(addDaysKey(dateKey, 1)) },
      },
      orderBy: [{ time: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(symptoms);
  }

  const symptoms = await prisma.symptom.findMany({ orderBy: { date: "asc" } });
  return NextResponse.json(symptoms);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const data = body as Record<string, unknown>;

  if (!isFeeling(data.feeling)) {
    return NextResponse.json({ error: "A valid feeling is required" }, { status: 400 });
  }
  const dateKey = typeof data.date === "string" ? data.date : "";
  if (!isValidDayKey(dateKey)) {
    return NextResponse.json({ error: "A valid date is required" }, { status: 400 });
  }
  const time = isValidTime(data.time) ? data.time : "";

  let volume: number | null = null;
  let emptied: boolean | null = null;
  if (data.feeling === FEELING_WITH_FOLLOWUP) {
    const v = Number(data.volume);
    volume = Number.isFinite(v) ? Math.min(Math.max(Math.trunc(v), 1), 10) : null;
    emptied = data.emptied === undefined || data.emptied === null ? null : Boolean(data.emptied);
  }

  const symptom = await prisma.symptom.create({
    data: { feeling: data.feeling, date: dayKeyToDate(dateKey), time, volume, emptied },
  });
  return NextResponse.json(symptom, { status: 201 });
}
