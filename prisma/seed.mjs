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

  if ((await prisma.symptom.count()) === 0) {
    const seedSymptoms = [
      { feeling: "bloated", date: d(0), time: "08:30", volume: null, emptied: null },
      { feeling: "just_pooped", date: d(0), time: "10:20", volume: 7, emptied: true },
      { feeling: "abdominal_pain", date: d(0), time: "13:45", volume: null, emptied: null },
    ];
    for (const s of seedSymptoms) await prisma.symptom.create({ data: s });
    console.log(`Seeded ${seedSymptoms.length} symptoms.`);
  }

  if ((await prisma.food.count()) === 0) {
    const seedFoods = [
      { name: "Oatmeal with banana", date: d(0), time: "08:15", calories: 320, protein: 9, fat: 6, sugar: 14, carbs: 58, fiber: 8 },
      { name: "Grilled chicken salad", date: d(0), time: "12:30", calories: 450, protein: 38, fat: 22, sugar: 6, carbs: 18, fiber: 5 },
    ];
    for (const f of seedFoods) await prisma.food.create({ data: f });
    console.log(`Seeded ${seedFoods.length} foods.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
