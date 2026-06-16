import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPriority, isStatus } from "@/lib/tasks";

export async function GET() {
  const tasks = await prisma.task.findMany({
    orderBy: [{ status: "asc" }, { order: "asc" }, { createdAt: "asc" }],
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

  const description =
    typeof data.description === "string" ? data.description.trim() : "";
  const status = isStatus(data.status) ? data.status : "backlog";
  const priority = isPriority(data.priority) ? data.priority : "medium";

  const task = await prisma.task.create({
    data: { title, description, status, priority },
  });

  return NextResponse.json(task, { status: 201 });
}
