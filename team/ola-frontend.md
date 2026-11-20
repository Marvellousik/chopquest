# Ola: frontend (every screen)

You build all screens. Use the shared contracts in [README.md](README.md). Until Marv's APIs are live, build each screen against a fake JSON file in `src/data/fake/` with the same shape, then swap in the real `fetch`.

## Design rules (already in the codebase, keep to them)

- Reuse `Button`, `Badge`, `Card`, `PageHeader` from `@/components/ui` and icons from `@/components/icons`. Add new icons in the same file and style.
- **No emoji anywhere.** No grids of identical bordered cards. Premium game feel through motion: `animate-pop`, `animate-rise`, `animate-float`, staggered reveals (`animationDelay`), the ledge buttons. Always `motion-safe:`.
- Colours only from tokens in `globals.css` (`leaf-dark`, `ink-soft`, `gold`, `muted`, `mist`, `line`...). No `stone-*` or raw hex.
- Mobile first (375px). Tap targets at least 48px. Naira as ₦. Every protein or cost figure says "estimate". Missing price shows a `Badge` saying "price coming".
- Every screen that loads data has four states: **loading** (skeleton shaped like the content), **empty** (what goes here and the one action that fills it), **error** (what broke, a retry button), **full**.

## Navigation

Change the bottom nav to: **Board** (`/`), **Cafeterias** (`/cafeterias`), **Kitchen** (`/kitchen`). Remove Scan, Dex and Ranks. The pet, quests and leaderboard are out of the demo.

## Public side (students)

### 1. Board `/`
The first thing judges and students see.
- Title "Campus Plant Board", one line: "Plant-based dishes on campus, rated by students."
- **Ranked list of the 5 cafeterias** (`GET /api/board`). Each row: big rank numeral, cafeteria name, number of plant dishes, average stars, number of reviews. The top 3 get gold, silver and bronze rank badges. Rows rise in one after another (stagger).
- Below it: **"Top rated dishes this week"**, a horizontal scroll of up to 6 dishes: name, cafeteria, stars, price, "Would order again 82%".
- Empty state: "No plant dishes rated yet. Be the first to review one." with a button to `/cafeterias`.

### 2. Cafeterias `/cafeterias`
- The 5 cafeterias as a list (not identical cards): name, location line, count of plant dishes, rating. Tap opens the cafeteria.

### 3. Cafeteria page `/cafeterias/[slug]`
- Header: name, rank on the board, average rating.
- **Plant dishes** (`GET /api/cafeterias/:slug/plant-dishes`): for each, name, price, protein estimate, stars, review count. Tap opens the dish.
- Empty: "This cafeteria hasn't added a plant dish yet."

### 4. Dish page `/dishes/[id]`
The page that convinces a nervous student to try it.
- Dish name, cafeteria, price, "~27 g protein (estimate)".
- **"What changed"** strip: "Chicken swapped for soy chunks and moi moi", with before and after protein side by side.
- Rating summary: big average stars, total reviews, "Would order again" percentage as an animated fill bar.
- **Reviews list**, newest first: nickname, stars, "Would order again" yes/no, comment, time ago.
- **"Write a review"** button, opens screen 5.

### 5. Write a review (sheet or `/dishes/[id]/review`)
- Nickname (saved in localStorage after the first time), 1 to 5 stars (big tappable stars with a pop on select), "Would you order it again?" yes/no, optional comment (max 280 characters).
- Submit calls `POST /api/plant-dishes/:id/reviews`. On success, return to the dish page and animate the new review in. Show errors in plain words.

## Kitchen side (cafeteria managers)

### 6. Kitchen home `/kitchen`
- "Which cafeteria are you?" with the 5 cafeterias. The choice is saved in localStorage.

### 7. Menu board `/kitchen/[slug]`
- The cafeteria's menu (`GET /api/cafeterias/:slug/menu`), top sellers first: dish name, student price, main protein, a **convertibility meter** (easy, medium, hard) from the engine.
- Tap a dish to open screen 8.

### 8. Dish breakdown and limits `/kitchen/[slug]/[itemId]`
- **Breakdown** (`POST /api/menu-items/:id/breakdown`): list of parts with grams, e.g. "Rice 250 g, Chicken 120 g, Stew 80 g". Each part can be corrected from a dropdown of foods, the same way as the current scan confirm list.
- **Limits panel** (`SwapLimits`): max cost per plate (₦ input), minimum protein kept (slider 50 to 100%), "Keep it the same dish" toggle, max extra prep time (chips: 0, 15, 30 min).
- Big button "Find swaps". While waiting, show the scanner-style animation (reuse `ScanReticle` style) and "Chloe is working out swaps".

### 9. Swap results (same page, below)
The money screen of the demo.
- **Top 3 options** (`POST /api/menu-items/:id/swaps`). Option 1 is large; 2 and 3 are smaller below it.
- Each option shows:
  - What comes out and what goes in: "Chicken 120 g out. Soy chunks 60 g + moi moi 1 wrap in."
  - **Before vs after** with animated numbers counting up: protein (g), cost per plate (₦), margin per plate (₦).
  - "Complete protein" badge if true.
  - Score out of 100 as a ring that fills.
  - **"Why this swap"**: the `reasons` list as rows with points, e.g. "+3 fits jollof", "+2 cheapest protein per ₦".
  - "price coming" badges for foods with no price yet.
- Button on each: "Make kitchen card".

### 10. Kitchen card
- From `POST /api/swaps/kitchen-card`: menu name, student blurb, numbered prep steps.
- A "Checked against our food list" badge when `validated` is true.
- Price input (pre-filled with the old price), then **"Publish to the board"** (`POST /api/plant-dishes`). On success, a short celebration (pop and a drawn check), then a link "See it on the board".

## Also

- `/demo`: the same kitchen flow using saved fixtures and no network (Pascal and Jason provide fixtures). Test with Wi-Fi off.
- Check every screen at 375px and on a real phone through the Vercel preview link.

## Order of work

1. Nav + Board (1) with fake data. 2. Kitchen menu board (7) + breakdown and limits (8). 3. Swap results (9). 4. Dish page (4) + review form (5). 5. Kitchen card (10). 6. Cafeterias (2, 3). 7. Demo mode and phone testing.
