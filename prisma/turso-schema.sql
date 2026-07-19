-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "seriesId" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'task',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "date" DATETIME NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT true,
    "time" TEXT NOT NULL DEFAULT '',
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "repeat" TEXT NOT NULL DEFAULT 'none',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Symptom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "feeling" TEXT NOT NULL,
    "volume" INTEGER,
    "emptied" BOOLEAN,
    "date" DATETIME NOT NULL,
    "time" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Food" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "calories" REAL NOT NULL DEFAULT 0,
    "protein" REAL NOT NULL DEFAULT 0,
    "fat" REAL NOT NULL DEFAULT 0,
    "sugar" REAL NOT NULL DEFAULT 0,
    "carbs" REAL NOT NULL DEFAULT 0,
    "fiber" REAL NOT NULL DEFAULT 0,
    "date" DATETIME NOT NULL,
    "time" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Task_date_idx" ON "Task"("date");

-- CreateIndex
CREATE INDEX "Task_seriesId_idx" ON "Task"("seriesId");

-- CreateIndex
CREATE INDEX "Symptom_date_idx" ON "Symptom"("date");

-- CreateIndex
CREATE INDEX "Food_date_idx" ON "Food"("date");

