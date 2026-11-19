# ChopQuest

Keep your jollof, upgrade your protein. See `CLAUDE.md` for the full brief.

## Setup

1. Create a free Neon project and run `db/schema.sql` in its SQL editor.
   (Already ran it before step 2? Just run `db/002_scan_cache.sql`.)
2. `cp .env.example .env.local` and fill in `DATABASE_URL` and `GEMINI_API_KEY` (free key from aistudio.google.com).
   Optional: `GEMINI_MODEL` (default `gemini-flash-latest`).
3. `npm install`
4. `npm run seed` loads `data/protein_db.csv` into `foods` (safe to re-run after price updates).
5. `npm run dev`, then open http://localhost:3000

## Status

- [x] Step 1 — Onboarding (nickname + group → user, `user_id` kept in localStorage)
- [x] Step 2 — Scan (photo → Gemini → one-tap confirm list → saved scan)
- [ ] Step 3 — Protein Map
