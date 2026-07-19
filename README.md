# Backlog

A clean, Notion-style **daily agenda** built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Prisma + SQLite**.

## Modes

A switch in the top-left toggles between two modes (the choice is remembered in `localStorage`):

- **Productivity** — the task/event agenda described below (day timeline + month calendar).
- **Symptoms** — a symptom tracker. Log a **symptom** by answering "What are you feeling?" (e.g. *I just pooped*, *I feel bloated*); choosing *I just pooped* reveals follow-up questions for **volume (1–10)** and whether you **feel emptied**. You can also log **foods** with a name plus calories, protein, fat, sugar, carbs, and fiber, and the day shows running nutrition totals.

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

## Access (password gate)

The whole app is behind a single shared password. Unauthenticated visitors are redirected to `/login`; entering the correct password sets a signed session cookie (via `src/middleware.ts` and `src/lib/auth.ts`). A **Lock** button signs out.

- Local dev password: `SITE_PASSWORD` in `.env` (defaults to `changeme`).
- In production set `SITE_PASSWORD` and a long random `SESSION_SECRET` in the host dashboard.

## Deployment (Vercel + Turso)

Local dev uses the SQLite file; **production uses a hosted [Turso](https://turso.tech) database** (libSQL, SQLite-compatible) so data persists and syncs across devices. `src/lib/prisma.ts` automatically uses Turso when `TURSO_DATABASE_URL` is set, otherwise it falls back to the local SQLite file.

One-time setup:

1. Create a Turso database, then run the DDL in `prisma/turso-schema.sql` against it once (Turso web SQL console or `turso db shell <db> < prisma/turso-schema.sql`).
2. Deploy the repo to Vercel and set these environment variables:
   - `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` (from Turso)
   - `SITE_PASSWORD` (your chosen password)
   - `SESSION_SECRET` (a long random string, e.g. `openssl rand -hex 32`)
3. Every push to `main` auto-redeploys.

See `.env.example` for the full list of variables.
