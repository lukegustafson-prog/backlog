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

const seedEvents = [
  { title: "Morning standup", date: d(0), time: "09:00", description: "Share yesterday's progress" },
  { title: "Team lunch", date: d(0), time: "12:30", description: "" },
  { title: "Dentist appointment", date: d(0), time: "15:00", description: "Bring insurance card" },
  { title: "Yoga class", date: d(1), time: "18:00", description: "" },
];

async function main() {
  const count = await prisma.task.count();
  if (count > 0) {
    console.log(`Database already has ${count} row(s); skipping seed.`);
    return;
  }
  for (const event of seedEvents) {
    await prisma.task.create({
      data: { kind: "event", allDay: false, repeat: "none", ...event },
    });
  }
  console.log(`Seeded ${seedEvents.length} events.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
