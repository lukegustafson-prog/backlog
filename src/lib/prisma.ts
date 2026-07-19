import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const log: ("error" | "warn")[] =
    process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];

  // In production (or anywhere TURSO_DATABASE_URL is set) talk to the hosted
  // Turso database via the libSQL driver adapter. Locally, with no Turso URL,
  // fall back to the plain client which uses the SQLite file in DATABASE_URL.
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  if (tursoUrl) {
    const adapter = new PrismaLibSQL({
      url: tursoUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return new PrismaClient({ adapter, log });
  }

  return new PrismaClient({ log });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
