import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const seedTasks = [
  {
    title: "Set up project repository",
    description: "Initialize the codebase and configure tooling.",
    status: "done",
    priority: "high",
    order: 0,
  },
  {
    title: "Design the backlog board",
    description: "Sketch the Kanban columns and card layout.",
    status: "in_progress",
    priority: "medium",
    order: 0,
  },
  {
    title: "Add drag-free status controls",
    description: "Allow moving tasks between columns with buttons.",
    status: "todo",
    priority: "medium",
    order: 0,
  },
  {
    title: "Write API documentation",
    description: "Document the REST endpoints for tasks.",
    status: "backlog",
    priority: "low",
    order: 0,
  },
];

async function main() {
  const count = await prisma.task.count();
  if (count > 0) {
    console.log(`Database already has ${count} task(s); skipping seed.`);
    return;
  }
  for (const task of seedTasks) {
    await prisma.task.create({ data: task });
  }
  console.log(`Seeded ${seedTasks.length} tasks.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
