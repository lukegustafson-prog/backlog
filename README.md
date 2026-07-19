# Backlog

A clean, Notion-style **daily agenda** built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Prisma + SQLite**.

## Modes

A switch in the top-left toggles between two modes (the choice is remembered in `localStorage`):

- **Productivity** — the task/event agenda described below (day timeline + month calendar).
- **Symptoms** — a symptom tracker. Log a **symptom** from a clinical list (*Defecation urgency*, *Bowel movement*, *Abdominal pain*, *Abdominal bloating / distension*, *Nausea*); choosing *Bowel movement* reveals follow-up questions for **stool volume (1–10)** and **sensation of complete evacuation**. You can also log **foods** with a name plus calories, protein, fat, sugar, carbs, and fiber, and the day shows running nutrition totals.

## Productivity mode

Tasks behave like calendar events: each is scheduled on a day (optionally at a time), you check them off when done, and you can navigate between days with the back/forward arrows. There are two item kinds:

- **Tasks** have a checkbox you tick off when complete. They start **unscheduled** above a vertical hour-by-hour **timeline**; press **Assign to time** to drop a task onto the timeline at a chosen hour.
- **Events** are reminders with no checkbox (e.g. a lunch or appointment). Events always require a time, chosen by **hour + AM/PM**, and appear directly on the timeline.

Adding an item opens a Google-Calendar-style dialog where you pick the kind, set a time, and choose how it repeats — including a **Custom** option (repeat every N days/weeks/months, pick weekdays for weekly, and end after a number of occurrences or on a date).

Toggle the calendar icon to switch to a **month calendar view** that colours each day by task completion: **green** when ≥ 80% of that day's tasks are done, **yellow** at ≥ 50%, and **red** below 50%. Click any day to jump back to its agenda.

## Tech stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** for styling
- **Prisma** ORM with a local **SQLite** database
- REST API via Next.js Route Handlers (`/api/tasks`)

## Getting started

Install dependencies (this also runs `prisma generate` via the `postinstall` hook):

```bash
npm install
```

Create / sync the local SQLite database and seed sample tasks (only needed the first time, or after schema changes):

```bash
npm run db:push
npm run db:seed
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script            | Description                                  |
| ----------------- | -------------------------------------------- |
| `npm run dev`     | Start the Next.js dev server (hot reload)    |
| `npm run build`   | Production build                             |
| `npm start`       | Run the production build                     |
| `npm run lint`    | Run ESLint (`next lint`)                      |
| `npm run db:push` | Sync the Prisma schema to the SQLite db      |
| `npm run db:seed` | Seed the database with sample tasks          |

## API

| Method   | Endpoint                     | Description                                              |
| -------- | ---------------------------- | -------------------------------------------------------- |
| `GET`    | `/api/tasks?date=YYYY-MM-DD` | List tasks for a given day (omit `date` for all tasks)   |
| `POST`   | `/api/tasks`                 | Create a task; repeating tasks materialize a series      |
| `PATCH`  | `/api/tasks/:id`             | Update a task (e.g. toggle `completed`, edit fields)     |
| `DELETE` | `/api/tasks/:id?scope=series`| Delete a task; `scope=series` deletes the whole series   |

A repeating task is stored as multiple rows sharing a `seriesId` (one row per occurrence, up to 60), so checking one off does not affect the others.

The database connection string lives in `.env` (`DATABASE_URL="file:./dev.db"`). It only points at a local SQLite file, so it is safe to commit.
