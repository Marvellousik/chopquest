# Marv: backend (with Claude)

You own the database, every API route, the **swap engine** (the scoring that finds the top 3 swaps) and the public board's rankings and reviews. Everything else connects through you, so the contracts in [README.md](README.md) go in first.

## 0. First hour: unblock everyone

1. `src/lib/types.ts` with the shared types from the README. Commit it first.
2. Migration `db/003_cafeterias.sql` (below). Run `npm run db:setup`.
3. Stub every API route returning fixed data of the right shape, so Ola can start.

## 1. Database (Turso, SQLite)

```sql
CREATE TABLE IF NOT EXISTS cafeterias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,            -- ase-cafe, bush-cafe, munchbox, first-cafe, second-cafe
  name TEXT NOT NULL,
  location TEXT
);
CREATE TABLE IF NOT EXISTS menu_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cafeteria_id INTEGER NOT NULL REFERENCES cafeterias(id),
  name TEXT NOT NULL,
  price_ngn REAL NOT NULL,
  is_top_seller INTEGER NOT NULL DEFAULT 0,
  breakdown TEXT,                       -- JSON DishPart[] from Pascal's breakdownDish()
  UNIQUE (cafeteria_id, name)
);
CREATE TABLE IF NOT EXISTS plant_dishes (  -- a swap a cafeteria published
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cafeteria_id INTEGER NOT NULL REFERENCES cafeterias(id),
  menu_item_id INTEGER NOT NULL REFERENCES menu_items(id),
  name TEXT NOT NULL,
  price_ngn REAL NOT NULL,
  protein_g REAL NOT NULL,
  option TEXT NOT NULL,                 -- JSON SwapOption
  card TEXT NOT NULL,                   -- JSON KitchenCard
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plant_dish_id INTEGER NOT NULL REFERENCES plant_dishes(id),
  device_id TEXT NOT NULL,              -- random id kept in localStorage: one review per dish per device
  nickname TEXT NOT NULL,
  stars INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
  would_order_again INTEGER NOT NULL,
  comment TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (plant_dish_id, device_id)
);
CREATE INDEX IF NOT EXISTS reviews_dish ON reviews (plant_dish_id, created_at);
```

Seed: `scripts/seed-cafeterias.mts` loads the 5 cafeterias and `team/market-survey/cafeteria-menus.csv` (Jason) into `menu_items`. Safe to re-run. Foods and prices still come from `data/protein_db.csv` via `npm run seed`.

## 2. Swap engine: `findSwaps()` (the core)

`src/lib/swap.ts`: a plain function with **no database or network**, so the offline demo can run it in the browser. Write tests (Vitest) for it.

```ts
findSwaps(breakdown: DishPart[], dishName: string, limits: SwapLimits, foods: Food[], addons: AddonMap): SwapOption[]
```

Steps:
1. **What comes out:** the parts whose food type is `Animal` (chicken, beef, fish, egg...).
2. **Candidates:** every `Plant` and `Alternative` food, alone or in pairs (e.g. soy chunks + moi moi), in portion steps (½, 1, 1½ servings). Use `serving_g` once Jason adds it; until then 60 g dry soy chunks, 1 wrap moi moi (~120 g) and so on.
3. **Compute** for each candidate: protein after (as-eaten values), cost per plate after (`price_ngn_per_kg × grams / 1000`, plus the parts that stay), and whether the plate is a complete protein (grain + legume, or soy).
4. **Hard limits** (drop the candidate if any fails): cost ≤ `maxCostPerPlateNgn`; protein kept ≥ `minProteinKeptPct`; if `keepDishIdentity`, every added food must be in the add-on map for this dish; extra prep ≤ `maxExtraPrepMin` (prep minutes per food from the add-on map).
5. **Score** the survivors from 0 to 100 and keep the reasons:

| Factor | Points |
|---|---|
| Protein kept (closer to 100% is better) | up to 30 |
| Cost saving per plate | up to 25 |
| Fits the dish (add-on map strength) | up to 20 |
| Complete protein | 10 |
| Less extra prep | up to 10 |
| Uses a cheap, easy-to-find local food (from Jason's availability column) | up to 5 |

6. Return the **top 3** with different main proteins, so the manager gets a real choice. A food with no price is still allowed: cost is `null`, it scores 0 on the cost factor and is listed in `priceMissing`.

Also `convertibility(menuItem)`: run `findSwaps` with default limits; easy if option 1 scores 70 or more, medium 40 to 69, hard otherwise or no option. Used on the menu board.

Add-on map `src/lib/addons.ts` (content from Jason): dish → foods that fit it, with a strength (1 to 3) and extra prep minutes.

## 3. Board ranking

`GET /api/board`: rank cafeterias with a **Bayesian average** so one 5-star review can't beat twenty 4-star ones:

```
score = (C × m + sum_of_stars) / (C + review_count)      m = average stars across all dishes, C = 5
```

Then add up to +0.3 for having more plant dishes (0.1 each, max 3). Cafeterias with no reviews go at the bottom, in "Getting started". Same formula for "Top rated dishes".

## 4. Reviews

- `POST /api/plant-dishes/:id/reviews` validates: nickname 2 to 20 characters, stars 1 to 5, comment at most 280 characters, `device_id` required. A duplicate (same dish and device) returns 409 "You've already reviewed this dish".
- Simple abuse guard: at most 10 reviews per device per hour.
- **No fake reviews.** Real reviews only, from the student tests Jason runs on Saturday morning.

## 5. API routes

Exactly the list in the README. Rules: validate every input, never trust IDs, plain friendly errors, `await connection()` on GET routes so they never prerender, and every AI (OpenRouter) call wrapped so a failure never loses data.

## Order of work

1. Types + migration + stubs (first hour). 2. Seed cafeterias and menus. 3. `findSwaps()` + tests on 3 dishes. 4. Breakdown and swaps routes (calling Pascal's function). 5. Publish plant dish. 6. Reviews + board ranking. 7. `convertibility` for the menu board. 8. Evidence numbers: run `findSwaps` over every menu item and output the share with a swap within budget, average protein kept and average cost change.
