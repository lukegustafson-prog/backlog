import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function dayKeyToDate(key) {
  return new Date(`${key}T00:00:00.000Z`);
}

function addDaysKey(key, amount) {
  const d = dayKeyToDate(key);
  d.setUTCDate(d.getUTCDate() + amount);
  return d.toISOString().slice(0, 10);
}

const today = new Date().toISOString().slice(0, 10);
const tomorrow = addDaysKey(today, 1);

const seedTasks = [
  {
    title: "Morning standup",
    description: "Sync with the team on today's priorities.",
    date: dayKeyToDate(today),
    allDay: false,
    time: "09:00",
  },
  {
    title: "Review pull requests",
    description: "Go through open PRs and leave feedback.",
    date: dayKeyToDate(today),
    allDay: true,
    completed: true,
  },
  {
    title: "Plan the next release",
    description: "Draft the milestone scope.",
    date: dayKeyToDate(today),
    allDay: false,
    time: "14:30",
  },
  {
    title: "Water the plants",
    description: "",
    date: dayKeyToDate(tomorrow),
    allDay: true,
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
