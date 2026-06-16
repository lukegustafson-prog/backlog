import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isRepeat } from "@/lib/tasks";
import { isValidDayKey, dayKeyToDate } from "@/lib/date";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const update: Record<string, unknown> = {};

  if (typeof data.title === "string") {
    const title = data.title.trim();
    if (!title) {
      return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
    }
    update.title = title;
  }
  if (typeof data.description === "string") {
    update.description = data.description.trim();
  }
  if (data.completed !== undefined) {
    update.completed = Boolean(data.completed);
  }
  if (data.allDay !== undefined) {
    update.allDay = Boolean(data.allDay);
  }
  if (typeof data.time === "string") {
    update.time = data.time;
  }
  if (data.repeat !== undefined) {
    if (!isRepeat(data.repeat)) {
      return NextResponse.json({ error: "Invalid repeat value" }, { status: 400 });
    }
    update.repeat = data.repeat;
  }
  if (data.date !== undefined) {
    if (!isValidDayKey(data.date)) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    update.date = dayKeyToDate(data.date);
  }

  try {
    const task = await prisma.task.update({ where: { id }, data: update });
    return NextResponse.json(task);
  } catch {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope");

  try {
    if (scope === "series") {
      const task = await prisma.task.findUnique({ where: { id } });
      if (task?.seriesId) {
        await prisma.task.deleteMany({ where: { seriesId: task.seriesId } });
        return NextResponse.json({ ok: true, deleted: "series" });
      }
    }
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ ok: true, deleted: "one" });
  } catch {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
}
