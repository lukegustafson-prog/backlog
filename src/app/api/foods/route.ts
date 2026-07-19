import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NUTRITION_FIELDS } from "@/lib/symptoms";
import { addDaysKey, dayKeyToDate, isValidDayKey } from "@/lib/date";
import { isValidTime } from "@/lib/time";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateKey = searchParams.get("date");

  if (dateKey) {
    if (!isValidDayKey(dateKey)) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    const foods = await prisma.food.findMany({
      where: {
        date: { gte: dayKeyToDate(dateKey), lt: dayKeyToDate(addDaysKey(dateKey, 1)) },
      },
      orderBy: [{ time: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(foods);
  }

  const foods = await prisma.food.findMany({ orderBy: { date: "asc" } });
  return NextResponse.json(foods);
}

function nonNegative(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const name = typeof data.name === "string" ? data.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "A food name is required" }, { status: 400 });
  }
  const dateKey = typeof data.date === "string" ? data.date : "";
  if (!isValidDayKey(dateKey)) {
    return NextResponse.json({ error: "A valid date is required" }, { status: 400 });
  }

  const nutrition = Object.fromEntries(
    NUTRITION_FIELDS.map((f) => [f.key, nonNegative(data[f.key])]),
  );
  const time = isValidTime(data.time) ? data.time : "";

  const food = await prisma.food.create({
    data: { name, date: dayKeyToDate(dateKey), time, ...nutrition },
  });
  return NextResponse.json(food, { status: 201 });
}
