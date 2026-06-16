import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPriority, isStatus } from "@/lib/tasks";

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
  if (data.status !== undefined) {
    if (!isStatus(data.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    update.status = data.status;
  }
  if (data.priority !== undefined) {
    if (!isPriority(data.priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }
    update.priority = data.priority;
  }

  try {
    const task = await prisma.task.update({ where: { id }, data: update });
    return NextResponse.json(task);
  } catch {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
}
