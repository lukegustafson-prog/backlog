-- Run this once against a fresh Turso database to create the events table.
-- (Regenerate with: npx prisma migrate diff --from-empty
--   --to-schema-datamodel prisma/schema.prisma --script)

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "seriesId" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'event',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "date" DATETIME NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "time" TEXT NOT NULL DEFAULT '',
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "repeat" TEXT NOT NULL DEFAULT 'none',
    "color" TEXT NOT NULL DEFAULT '#2383e2',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Task_date_idx" ON "Task"("date");

-- CreateIndex
CREATE INDEX "Task_seriesId_idx" ON "Task"("seriesId");

-- If you already created the Task table before the "color" column existed,
-- run this migration instead of recreating the table:
--   ALTER TABLE "Task" ADD COLUMN "color" TEXT NOT NULL DEFAULT '#2383e2';
