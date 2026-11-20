# ChopQuest — project brief for Claude Code

Team name: **Chloe**. The in-app AI assistant is also called **Chloe**.

Hack the Fork Nigeria 2026 (Veritas University, Abuja), **Track 2, Challenge 2: AI for Plant-Based Menu Innovation**.
Submission: **Sat 21 Nov 2026, 12:30 PM**. The full team plan, screen list, API contracts and role briefs are in `team/` — read `team/README.md` first.

## What we are building

1. **Kitchen (cafeteria managers):** pick a dish from a campus cafeteria's real menu, the AI breaks it into parts, the manager sets limits (max cost per plate, min protein kept, keep the dish recognisable, max extra prep), and the **swap engine** returns the top 3 plant-based swaps that replace the meat, with before/after protein and ₦ cost and the reasons. The AI then writes a kitchen card (menu name, student blurb, prep steps) that is **validated** against our food list. The manager publishes it.
2. **Public Plant Board (students):** the five cafeterias ranked by student reviews of their plant dishes; dish pages with ratings, "would order again" and reviews, so unsure students can see what others thought.

Cafeterias: **Ase Cafe, Bush Cafe, Munchbox, First Cafe, Second Cafe**.

The old student app (pet, quests, Dex, leaderboard, protein scanning game) is **out of the demo**. Don't extend it.

## Hard rules

- **No new costs.** Free tiers (Vercel Hobby, Turso) plus the team's existing OpenRouter credits for AI. Never add another paid service. Keep a credit limit on the deployed OpenRouter key.
- **Never invent data.** No fake prices, reviews or metrics. Missing price = `null`, shown as "price coming". Reviews come only from real students.
- **Label estimates.** Every protein and cost figure says "estimate". Not medical advice.
- **AI must be meaningful and checked:** structured outputs, matched to `foods`, validated; no free chatbot text.
- **No emoji in the UI.** SVG icons from `src/components/icons.tsx`; motion via `globals.css` keyframes with `motion-safe:`. Colours only from theme tokens. Tap targets ≥ 48px.
- **No photos stored.** Only parsed results.
- Calculations (protein, cost, swap scoring, ranking) are **plain functions in `src/lib/` with no DB or network**, so the offline `/demo` can run them in the browser.

## Stack

- Next.js (App Router) + TypeScript + Tailwind, mobile-first, Vercel Hobby
- Turso (libSQL / SQLite) via `@libsql/client` (`src/lib/db.ts`: `getDb()`, `query()`, `placeholders()`, `isUniqueViolation()`). Local dev can use `file:local.db`.
- AI through **OpenRouter** (OpenAI-compatible, team credits), **Claude Haiku 4.5** (`anthropic/claude-haiku-4.5`) with **Claude Sonnet 4.6** as fallback, both set by `OPENROUTER_MODEL` / `OPENROUTER_MODEL_FALLBACK`; no `temperature` sent to Claude, JSON output, results cached by input hash, 429/402 handled. Client in `src/lib/ai/client.ts` (replacing `src/lib/gemini.ts`). See `team/pascal-ai.md`.
- Node 22.18+ for the `.mts` scripts.

Env vars (`.env.local`, never commit): `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, optional `OPENROUTER_MODEL_FALLBACK`.

## Data

- `db/schema.sql` + numbered migrations in `db/`, applied with `npm run db:setup` (idempotent). Booleans 0/1, timestamps ISO-8601 UTC text, JSON as text.
- `data/protein_db.csv` — 38 Nigerian foods (protein per 100 g, type, ₦/kg). `npm run seed` loads it.
- `team/market-survey/` — Jason's menus, prices, suppliers, add-on map and eval dishes (CSV).

## Roles

Ola: frontend (all screens). Pascal: AI layer (breakdown, kitchen card + validator, accuracy eval). Marv: backend (DB, APIs, swap engine, board ranking, reviews). Jason: market survey and evidence.

## Out of scope

Login/passwords, payments, multiple languages, training a custom ML model, insect protein, the old pet/quest game.
