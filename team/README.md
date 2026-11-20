# ChopQuest: team plan (Hack the Fork Nigeria 2026, Challenge 2)

**What we are building:** an AI tool that helps our campus cafeterias swap meat in their top dishes for plant-based or alternative protein, at the same or lower cost per plate, plus a **public board** where students rate and review those swapped dishes, so people who are unsure can see what others thought before trying one.

**Cafeterias:** Ase Cafe, Bush Cafe, Munchbox, First Cafe, Second Cafe.

**Deadline:** final submission **Sat 21 Nov, 12:30 PM**. Code freeze 11:00 AM. Pitch 12:30 to 1:30 PM.

## Two sides of one app

| Side | Who uses it | What they do |
|---|---|---|
| **Kitchen** (`/kitchen`) | Cafeteria manager | Pick a dish, set limits, get the top 3 AI swaps with numbers, get a kitchen card, publish the dish |
| **Public board** (`/`) | Students, anyone | See cafeterias ranked by their plant-based dishes, open a dish, read reviews, leave a review |

The loop: the AI finds swaps, the cafeteria publishes one, students review it, and good reviews push the cafeteria up the board. That gives other cafeterias a reason to join.

## Who owns what

| Person | Role | Brief |
|---|---|---|
| Ola | Frontend: every screen | [ola-frontend.md](ola-frontend.md) |
| Pascal | AI: dish breakdown, kitchen card, AI accuracy test | [pascal-ai.md](pascal-ai.md) |
| Marv | Backend: database, APIs, swap engine, rankings, reviews | [marv-backend.md](marv-backend.md) |
| Jason | Market survey: menus, prices, suppliers, evidence | [jason-market-survey.md](jason-market-survey.md) and [market-survey/](market-survey/) |

## Shared contracts (agree on these before coding; change only by telling everyone)

These live in `src/lib/types.ts` (Marv creates them first). Frontend codes against them with fake data until the APIs exist.

```ts
type Cafeteria = { id: number; slug: string; name: string; location: string | null };

type MenuItem = {
  id: number; cafeteriaId: number; name: string;   // "Chicken jollof"
  priceNgn: number;                                 // what students pay
  isTopSeller: boolean;
  breakdown: DishPart[] | null;                     // filled by the AI
};

type DishPart = { foodId: number | null; label: string; grams: number; role: "protein" | "staple" | "soup" | "side" };

type SwapLimits = {
  maxCostPerPlateNgn: number | null;   // null = no limit
  minProteinKeptPct: number;           // e.g. 80 = keep at least 80% of the protein
  keepDishIdentity: boolean;           // only add-ons that fit this dish
  maxExtraPrepMin: number;             // e.g. 15
};

type SwapOption = {
  rank: 1 | 2 | 3;
  replaces: DishPart[];                // what comes out (the meat)
  adds: { foodId: number; label: string; grams: number }[];
  before: { proteinG: number; costNgn: number | null };
  after:  { proteinG: number; costNgn: number | null };
  completeProtein: boolean;
  score: number;                       // 0 to 100
  reasons: { factor: string; points: number; note: string }[];  // shown on screen
  priceMissing: string[];              // foods with no price yet: show "price coming"
};

type KitchenCard = { menuName: string; studentBlurb: string; steps: string[]; validated: boolean };

type PlantDish = {                     // a swap a cafeteria published
  id: number; cafeteriaId: number; menuItemId: number; name: string; priceNgn: number;
  proteinG: number; avgRating: number | null; reviewCount: number; wouldOrderAgainPct: number | null;
};

type Review = { id: number; plantDishId: number; nickname: string; stars: 1|2|3|4|5; wouldOrderAgain: boolean; comment: string | null; createdAt: string };

type CafeteriaRank = { cafeteria: Cafeteria; score: number; plantDishCount: number; reviewCount: number; avgRating: number | null };
```

## API list (Marv builds, Ola calls)

| Method and path | Returns |
|---|---|
| `GET /api/cafeterias` | `Cafeteria[]` |
| `GET /api/cafeterias/:slug/menu` | `MenuItem[]`, top sellers first, each with a convertibility score |
| `POST /api/menu-items/:id/breakdown` | runs the AI breakdown (Pascal) and saves it, returns `DishPart[]` |
| `POST /api/menu-items/:id/swaps` body `SwapLimits` | `SwapOption[]` (top 3) |
| `POST /api/swaps/kitchen-card` body `{ menuItemId, option }` | `KitchenCard` (Pascal) |
| `POST /api/plant-dishes` body `{ menuItemId, option, card, priceNgn }` | publishes a `PlantDish` |
| `GET /api/board` | `CafeteriaRank[]` |
| `GET /api/cafeterias/:slug/plant-dishes` | `PlantDish[]` |
| `GET /api/plant-dishes/:id` | `PlantDish` + `Review[]` |
| `POST /api/plant-dishes/:id/reviews` | the new `Review` |

## Team rules (from the hackathon guide and our own)

- **Never invent numbers.** No fake reviews, no made-up prices. Missing price shows "price coming". Seed reviews only from real students.
- **Label estimates.** Every protein and cost number says "estimate". Not medical advice.
- **No emoji in the UI.** Icons are SVG in `src/components/icons.tsx`. Game feel comes from motion.
- **No new costs.** Vercel Hobby and Turso free tiers; AI runs on our existing **OpenRouter credits** (credit limit on the deployed key).
- **No photos stored.** Only the parsed result.
- **One user per screen.** Kitchen screens are for managers; the board is for students.
- Branch per task, small PRs, one reviewer, `main` must always run.

## Timeline

| When | Milestone |
|---|---|
| Fri 2:50 PM | Mentor checkpoint 1: pitch the cafeteria user and the limits |
| Fri 4:50 PM | Mentor checkpoint 2: one dish goes through the swap engine on screen |
| Fri 9 PM | Kitchen flow works end to end with real menus from at least 2 cafeterias |
| Sat 9 AM | Board and reviews work; real reviews from students coming in |
| Sat 11 AM | Code freeze; evidence table filled; offline demo works |
| Sat 12:30 PM | Submit and pitch |
