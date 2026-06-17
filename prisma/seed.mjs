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
const d = (n) => dayKeyToDate(addDaysKey(today, n));

const seedTasks = [
  // 3 days ago: nothing done -> red
  { kind: "task", title: "Draft release notes", date: d(-3), allDay: true, completed: false },
  { kind: "task", title: "Triage bug reports", date: d(-3), allDay: true, completed: false },

  // 2 days ago: half done -> yellow
  { kind: "task", title: "Update dependencies", date: d(-2), allDay: true, completed: true },
  { kind: "task", title: "Fix flaky test", date: d(-2), allDay: true, completed: false },

  // Yesterday: all done -> green
  { kind: "task", title: "Ship hotfix", date: d(-1), allDay: true, completed: true },
  { kind: "task", title: "Reply to customer", date: d(-1), allDay: true, completed: true },

  // Today: scheduled tasks on the timeline, an unscheduled task, and an event
  { kind: "task", title: "Morning standup", date: d(0), allDay: false, time: "09:00", completed: false },
  { kind: "task", title: "Plan the next release", date: d(0), allDay: false, time: "14:00", completed: false },
  { kind: "task", title: "Write weekly report", date: d(0), allDay: true, completed: false },
  { kind: "task", title: "Review pull requests", date: d(0), allDay: true, completed: true },
  { kind: "event", title: "Team lunch", date: d(0), allDay: false, time: "12:00" },

  // Tomorrow
  { kind: "task", title: "Water the plants", date: d(1), allDay: true, completed: false },
  { kind: "event", title: "Dentist appointment", date: d(1), allDay: false, time: "16:00" },
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
  console.log(`Seeded ${seedTasks.length} items.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
