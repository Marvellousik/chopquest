# ChopQuest — project brief for Claude Code

Team name: **Chloe**. The in-app AI assistant users talk to is also called **Chloe**.

ChopQuest is a mobile-first web app for the Hack the Fork hackathon (Abuja, AI × alternative protein, "Plants on our Plates" track).
A user photographs a Nigerian meal. The AI shows where its protein comes from, checks whether it is a complete protein,
suggests ONE cheap local plant-protein upgrade with its Naira cost, turns it into a quest, and grows a virtual pet.
Tagline: "Keep your jollof, upgrade your protein."

Hard constraint: **zero cost**. Use only free tiers. Never add a paid service.

## Stack

- Next.js (App Router) + TypeScript + Tailwind, mobile-first, deployed on Vercel (Hobby, free)
- Turso (libSQL / SQLite, free plan) via `@libsql/client`. Local dev can use `file:local.db`.
- Gemini API, free tier, Flash model (`gemini-flash-latest` or the current free Flash / Flash-Lite model shown in AI Studio)
- No auth: users pick a nickname + group (hall/department). Store `user_id` in localStorage.
- Do NOT store photos. Send the image to Gemini as base64 from an API route and keep only the parsed result.

Env vars (`.env.local`, never commit):
```
TURSO_DATABASE_URL=libsql://...  # Turso Cloud URL, or file:local.db for offline dev
TURSO_AUTH_TOKEN=...             # turso db tokens create <db> (not needed for file:)
GEMINI_API_KEY=...               # from aistudio.google.com
```

## Data

- `db/schema.sql` — SQLite schema, applied with `npm run db:setup` (idempotent). Booleans are 0/1, timestamps ISO-8601 UTC text. Weekly resets (Monday, Lagos time = UTC+1) are computed in TypeScript, not SQL.
- `data/protein_db.csv` — 38 Nigerian foods. Seed the `foods` table from it with `npm run seed` (`scripts/seed.mts`).
- `price_ngn_per_kg` is mostly empty until the team's market survey; code must handle NULL prices (show "price coming" instead of a number).

## Core loop (build in this order)

1. **Onboarding** — nickname + group → create user.
2. **Scan** — camera/upload → `POST /api/scan` → Gemini returns JSON (prompt below) → show a confirm list where each item can be fixed with one tap (dropdown of foods from DB). Corrections set `scan_items.corrected = true`.
3. **Protein Map** — match items to `foods` (fuzzy match on `food` and `local_name`), protein_g = estimated_grams × protein_g_per_100g / 100. Show total grams, split by type (Animal / Plant / Alternative / Staple), and a pairing badge.
4. **Pairing check (rule-based)** — complete pair if the meal has a Staple grain AND a legume group (Beans, Bambara, Pigeon pea, Groundnut), OR contains Soy, OR contains Animal. Grain-only meal → flag "incomplete protein, low in lysine".
5. **Swap recommender** — pick ONE food from plant/alternative groups. Score = familiarity (fits the dish, hand-written map dish→good add-ons) + low ₦ per g protein + protein gain + completes pairing + novelty (user has not tried that dex_group). Show protein gained and cost; buttons Accept / Skip.
6. **Quest** — accepted swap → quest ("Add soy chunks to your stew twice this week", target 2). A later scan containing that dex_group increments progress.
7. **Pet + Protein Dex** — see scoring below. 3 pet stages (egg → young → evolved). Traits per dex_group: Beans=Strength, Soy=Defense, Bambara=Stamina, Groundnut=Energy, Egusi=Recovery, Mushroom=Focus, Iru=Wisdom, Tigernut=Speed, Pigeon pea=Agility. Animal = base stats only.
8. **Leaderboard** — groups ranked by average weekly diversity score of their members.
9. **Impact dashboard** — meals scanned, alt proteins detected, new sources per user, swap acceptance rate, repeat rate (accepted swap's dex_group eaten again later), change in diversity over time.

## Scoring rules (never reward eating more)

- Total calories / grams of protein NEVER earn points.
- Discovery: first time a dex_group appears for a user → +50, unlock trait.
- Weekly diversity score: distinct protein dex_groups eaten this week (Monday reset). Drives pet mood and leaderboard.
- Mastery per dex_group from `dex_progress.meal_count`: Bronze 3, Silver 10, Gold 25 (+20 / +40 / +80).
- Complete-protein meal: +10. Protein in a new dish combo for that user: +15.
- Quest completed: +30.
- Cheap and expensive proteins earn the same. Animal proteins are never penalised.
- Pet never loses progress; a week with low diversity makes it look sleepy only.

## Gemini vision prompt

```
You are a Nigerian food recognition assistant. Look at the photo of a meal and identify every visible food.
Use Nigerian dish names where they apply (jollof rice, ewa agoyin, moi moi, akara, okpa, efo riro, egusi soup, beans porridge, dodo, garri, eba, amala, pounded yam, suya, awara, Indomie, kuli-kuli).
For each food, estimate the portion in household units (spoons, wraps, pieces, cups).
If you are unsure, give your best guess and set confidence below 0.6.
Return ONLY valid JSON in this exact shape:
{"dish_name": "string", "items": [{"food": "string", "local_name": "string", "portion": "string", "estimated_grams": number, "cooking_method": "boiled|fried|steamed|stewed|raw|roasted", "confidence": number}]}
```
Use Gemini's JSON response mode (`responseMimeType: "application/json"`).

## Free-tier protection (important)

- The Gemini free tier has low daily request limits. Resize images client-side to ~768px JPEG before upload.
- Cache results by image hash. Handle 429 errors with a friendly "try again in a minute" message.
- **Demo mode:** `/demo` route with 3 pre-saved meal results (jollof + plantain + chicken; rice + beans; bread + egg) that never call the API. The live pitch must work even with no network.

## Out of scope (do not build)

Pet battles, login/passwords, payments, multiple languages, training a custom ML model.

## Style

Simple, friendly, bright. Large tap targets. Naira shown as ₦. Nutrition figures labelled as estimates, not medical advice.
