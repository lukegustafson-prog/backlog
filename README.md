# Backlog

A clean, Notion-style **daily agenda** built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Prisma + SQLite**.

Tasks behave like calendar events: each is scheduled on a day (optionally at a time), you check them off when done, and you can navigate between days with the back/forward arrows or jump to any date with the calendar picker. Adding a task opens a Google-Calendar-style dialog where you can set a time and choose whether it repeats (daily / weekly / monthly) and for how many occurrences.

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
