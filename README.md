# ChopQuest

Keep your jollof, upgrade your protein. See `CLAUDE.md` for the full brief.

## Setup

1. Create a free Turso database (`turso db create chopquest`), then get its URL
   (`turso db show chopquest --url`) and a token (`turso db tokens create chopquest`).
   Offline alternative: use `TURSO_DATABASE_URL=file:local.db` and skip the token.
2. `cp .env.example .env.local` and fill in `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` and `GEMINI_API_KEY`
   (free key from aistudio.google.com). Optional: `GEMINI_MODEL` (default `gemini-flash-latest`).
3. `npm install` (Node 22.18+)
4. `npm run db:setup` creates the tables (safe to re-run).
5. `npm run seed` loads `data/protein_db.csv` into `foods` (safe to re-run after price updates).
6. `npm run dev`, then open http://localhost:3000

On Vercel, set the same three env vars in Project Settings.

## Status

- [x] Step 1 — Onboarding (nickname + group → user, `user_id` kept in localStorage)
- [x] Step 2 — Scan (photo → Gemini → one-tap confirm list → saved scan)
- [ ] Step 3 — Protein Map
