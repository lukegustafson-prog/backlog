# Backlog

A Next.js (App Router) + TypeScript task backlog board, backed by Prisma + SQLite.

## Cursor Cloud specific instructions

- **Single service**: this is one Next.js full-stack app (UI + `/api/tasks` route handlers). Start it with `npm run dev` (serves on `http://localhost:3000`). There is no separate backend/database server — Prisma talks to a local SQLite file.
- **Database file is committed**: the SQLite db lives at `prisma/dev.db` and is committed to the repo (seeded with sample tasks), so the app runs immediately after `npm install`. The startup update script only runs `npm install` (which triggers `prisma generate` via the `postinstall` hook); it intentionally does NOT run migrations.
- **After changing `prisma/schema.prisma`**: run `npm run db:push` to sync the schema to `prisma/dev.db` (and `npm run db:seed` to repopulate an empty db). These are not part of the update script.
- **`.env` is committed on purpose**: it only contains `DATABASE_URL="file:./dev.db"` (a local SQLite path, no secrets).
- **Standard commands** are defined in `package.json` scripts and documented in `README.md` (`dev`, `build`, `start`, `lint`, `db:push`, `db:seed`).
- **Gotcha**: do not run `npm run build` while `npm run dev` is running — `next build` overwrites the shared `.next` directory and makes the dev server return 500s. If that happens, stop dev, `rm -rf .next`, and restart `npm run dev`.
