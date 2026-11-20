// Demo data (server only): seed a lively campus from src/lib/demo-data.ts, or remove all of it.
// Every created row is recorded in demo_records; clearDemo() deletes exactly those rows.
import { query } from "@/lib/db";
import { listFoods } from "@/lib/foods-db";
import { addonsFor, DEFAULT_PREP_MIN } from "@/lib/addons";
import { isComplete } from "@/lib/swap";
import { validateCard } from "@/lib/ai/kitchen-card";
import { DEMO_CAFETERIAS, DEMO_COMMENTS, DEMO_PRICES, DEMO_USERS } from "@/lib/demo-data";
import type { DishPart, Food, KitchenCard, SwapOption } from "@/lib/types";

const TABLES = ["reviews", "plant_dishes", "scans", "menu_item_stats", "menu_items", "users", "cafeteria_prices"] as const;

/** Small deterministic PRNG so a reseed gives the same campus. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function tag(table: string, key: string | number) {
  await query("INSERT OR IGNORE INTO demo_records (table_name, row_key) VALUES (?, ?)", [table, String(key)]);
}

/** Monday 00:00 in Lagos (UTC+1), as a UTC Date. */
function lagosWeekStart(now: Date) {
  const lagos = new Date(now.getTime() + 3600_000);
  const day = (lagos.getUTCDay() + 6) % 7; // Monday = 0
  const monday = Date.UTC(lagos.getUTCFullYear(), lagos.getUTCMonth(), lagos.getUTCDate() - day);
  return new Date(monday - 3600_000);
}

const iso = (d: Date) => d.toISOString();

export async function demoStatus(): Promise<{ demo: boolean; counts: Record<string, number> }> {
  const rows = await query<{ table_name: string; n: number }>("SELECT table_name, COUNT(*) AS n FROM demo_records GROUP BY table_name");
  const counts = Object.fromEntries(rows.map((r) => [r.table_name, Number(r.n)]));
  return { demo: rows.length > 0, counts };
}

export async function clearDemo(): Promise<Record<string, number>> {
  const ids = async (t: string) =>
    (await query<{ row_key: string }>("SELECT row_key FROM demo_records WHERE table_name = ?", [t])).map((r) => r.row_key);
  const removed: Record<string, number> = {};
  const del = async (table: string, sql: string, args: (string | number)[]) => {
    if (!args.length) return;
    // Chunk to stay well under SQLite's parameter limit.
    for (let i = 0; i < args.length; i += 200) {
      const chunk = args.slice(i, i + 200);
      await query(sql.replace("__IN__", chunk.map(() => "?").join(", ")), chunk);
    }
    removed[table] = (removed[table] ?? 0) + args.length;
  };
  const dishIds = await ids("plant_dishes");
  const scanIds = await ids("scans");
  const menuIds = await ids("menu_items");
  // Reviews on demo dishes go too, even ones a real student wrote, since their dish is removed.
  await del("reviews", "DELETE FROM reviews WHERE plant_dish_id IN (__IN__)", dishIds);
  await del("reviews", "DELETE FROM reviews WHERE id IN (__IN__)", await ids("reviews"));
  await del("plant_dishes", "DELETE FROM plant_dishes WHERE id IN (__IN__)", dishIds);
  await del("scan_items", "DELETE FROM scan_items WHERE scan_id IN (__IN__)", scanIds);
  await del("scans", "DELETE FROM scans WHERE id IN (__IN__)", scanIds);
  await del("menu_item_stats", "DELETE FROM menu_item_stats WHERE menu_item_id IN (__IN__)", menuIds);
  await del("menu_items", "DELETE FROM menu_items WHERE id IN (__IN__)", menuIds);
  await del("users", "DELETE FROM users WHERE id IN (__IN__)", await ids("users"));
  for (const key of await ids("cafeteria_prices")) {
    const [cafe, food] = key.split(":").map(Number);
    await query("DELETE FROM cafeteria_prices WHERE cafeteria_id = ? AND food_id = ?", [cafe, food]);
    removed.cafeteria_prices = (removed.cafeteria_prices ?? 0) + 1;
  }
  await query("DELETE FROM demo_records");
  return removed;
}

function buildOption(parts: DishPart[], replace: string[], add: { foodId: number; label: string; grams: number }[], byId: Map<number, Food>, dishName: string): SwapOption {
  const out = parts.filter((x) => replace.includes(x.label));
  const stay = parts.filter((x) => !replace.includes(x.label));
  const prot = (id: number | null, g: number) => (id ? ((byId.get(id)?.protein_g_per_100g ?? 0) * g) / 100 : 0);
  const cost = (id: number | null, g: number) => {
    const pr = id ? byId.get(id)?.price_ngn_per_kg : null;
    return pr == null ? null : (pr * g) / 1000;
  };
  const sum = (xs: (number | null)[]) => (xs.some((x) => x == null) ? null : xs.reduce((s: number, x) => s + (x ?? 0), 0));
  const before = { proteinG: parts.reduce((s, x) => s + prot(x.foodId, x.grams), 0), costNgn: sum(parts.filter((x) => x.foodId).map((x) => cost(x.foodId, x.grams))) };
  const after = {
    proteinG: stay.reduce((s, x) => s + prot(x.foodId, x.grams), 0) + add.reduce((s, a) => s + prot(a.foodId, a.grams), 0),
    costNgn: sum([...stay.filter((x) => x.foodId).map((x) => cost(x.foodId, x.grams)), ...add.map((a) => cost(a.foodId, a.grams))]),
  };
  const fits = addonsFor(dishName);
  const prep = add.reduce((s, a) => s + (fits.get(byId.get(a.foodId)?.food ?? "")?.extraPrepMin ?? DEFAULT_PREP_MIN[byId.get(a.foodId)?.food ?? ""] ?? 0), 0);
  const complete = isComplete([...stay, ...add].map((x) => byId.get(x.foodId as number)).filter((f): f is Food => Boolean(f)));
  const kept = before.proteinG ? after.proteinG / before.proteinG : 0;
  const saving = before.costNgn != null && after.costNgn != null ? before.costNgn - after.costNgn : null;
  const pProtein = Math.round(30 * Math.min(1, Math.max(0, (kept - 0.5) / 0.5)));
  const pCost = saving != null && before.costNgn ? Math.round(25 * Math.min(1, Math.max(0, saving / before.costNgn))) : 0;
  const pComplete = complete ? 10 : 0;
  const pPrep = Math.round(10 * Math.min(1, Math.max(0, 1 - prep / 30)));
  return {
    rank: 1,
    replaces: out,
    adds: add,
    before: { proteinG: Math.round(before.proteinG * 10) / 10, costNgn: before.costNgn == null ? null : Math.round(before.costNgn) },
    after: { proteinG: Math.round(after.proteinG * 10) / 10, costNgn: after.costNgn == null ? null : Math.round(after.costNgn) },
    completeProtein: complete,
    extraPrepMin: prep,
    score: pProtein + pCost + pComplete + pPrep + 15,
    reasons: [
      { factor: "Protein kept", points: pProtein, note: `${Math.round(kept * 100)}% of the original protein (estimate)` },
      { factor: "Cost per plate", points: pCost, note: saving == null ? "price coming: not scored yet" : `₦${Math.round(Math.abs(saving))} ${saving >= 0 ? "cheaper" : "more"} than the original (demo prices)` },
      { factor: "Fits the dish", points: 15, note: "a common pairing for this dish" },
      { factor: "Complete protein", points: pComplete, note: complete ? "all essential amino acids on the plate" : "add a grain or legume to complete it" },
      { factor: "Kitchen effort", points: pPrep, note: prep === 0 ? "no extra prep" : `about ${prep} min extra prep` },
    ],
    priceMissing: [],
  };
}

/** Seed the demo campus. Clears any previous demo data first, so it's safe to re-run. */
export async function seedDemo(now = new Date()): Promise<Record<string, number>> {
  await clearDemo();
  const rand = rng(20261120);
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
  const foods = await listFoods();
  const foodId = (name: string) => {
    const f = foods.find((x) => x.food === name);
    if (!f) throw new Error(`demo data: no food "${name}"`);
    return f.id;
  };
  const cafes = await query<{ id: number; slug: string }>("SELECT id, slug FROM cafeterias");
  const weekStart = lagosWeekStart(now).getTime();
  const span = Math.max(3600_000, now.getTime() - weekStart - 30 * 60_000);
  const thisWeek = () => new Date(weekStart + 3600_000 + rand() * (span - 3600_000));
  const counts: Record<string, number> = {};
  const count = (t: string) => (counts[t] = (counts[t] ?? 0) + 1);

  // Students.
  const userIds: number[] = [];
  for (const u of DEMO_USERS) {
    const rows = await query<{ id: number }>(
      "INSERT INTO users (nickname, group_name, created_at) VALUES (?, ?, ?) ON CONFLICT (nickname) DO NOTHING RETURNING id",
      [u.nickname, u.group, iso(new Date(weekStart - (2 + rand() * 20) * 86400_000))],
    );
    if (rows[0]) {
      userIds.push(Number(rows[0].id));
      await tag("users", rows[0].id);
      count("users");
    }
  }

  const plantPlates: { cafeteriaId: number; name: string; parts: DishPart[]; option: SwapOption; dishId: number }[] = [];

  for (const dc of DEMO_CAFETERIAS) {
    const cafe = cafes.find((c) => c.slug === dc.slug);
    if (!cafe) continue;

    // Demo prices for this cafeteria (never overwrite a real manager's price).
    for (const [name, perKg] of Object.entries(DEMO_PRICES)) {
      const id = foodId(name);
      const r = await query<{ food_id: number }>(
        "INSERT INTO cafeteria_prices (cafeteria_id, food_id, price_ngn_per_kg, supplier) VALUES (?, ?, ?, 'demo price') ON CONFLICT (cafeteria_id, food_id) DO NOTHING RETURNING food_id",
        [cafe.id, id, perKg],
      );
      if (r[0]) {
        await tag("cafeteria_prices", `${cafe.id}:${id}`);
        count("cafeteria_prices");
      }
    }
    const own = await query<{ food_id: number; price_ngn_per_kg: number }>("SELECT food_id, price_ngn_per_kg FROM cafeteria_prices WHERE cafeteria_id = ?", [cafe.id]);
    const byId = new Map(foods.map((f) => [f.id, { ...f, price_ngn_per_kg: own.find((o) => o.food_id === f.id)?.price_ngn_per_kg ?? f.price_ngn_per_kg }]));

    // Menu.
    const menuParts = new Map<string, { id: number; parts: DishPart[] }>();
    for (const m of dc.menu) {
      const parts: DishPart[] = m.parts.map((x) => ({ foodId: foodId(x.food), label: x.label, grams: x.grams, role: x.role }));
      const r = await query<{ id: number }>(
        "INSERT INTO menu_items (cafeteria_id, name, price_ngn, is_top_seller, breakdown) VALUES (?, ?, ?, ?, ?) ON CONFLICT (cafeteria_id, name) DO NOTHING RETURNING id",
        [cafe.id, m.name, m.priceNgn, m.topSeller ? 1 : 0, parts.length ? JSON.stringify(parts) : null],
      );
      if (!r[0]) continue; // a real dish with this name exists: leave it alone
      const id = Number(r[0].id);
      await tag("menu_items", id);
      count("menu_items");
      await query("INSERT OR REPLACE INTO menu_item_stats (menu_item_id, plates_per_week, manager_confirmed) VALUES (?, ?, 1)", [id, m.platesPerWeek]);
      await tag("menu_item_stats", id);
      menuParts.set(m.name, { id, parts });
    }

    // Published plant dishes (snacks and drinks included).
    for (const pd of dc.plantDishes) {
      const base = menuParts.get(pd.from);
      if (!base) continue;
      const adds = pd.add.map((a) => ({ foodId: foodId(a.food), label: a.label, grams: a.grams }));
      const option = buildOption(base.parts, pd.replace, adds, byId, pd.from);
      const card: KitchenCard = { menuName: pd.name, studentBlurb: pd.blurb, steps: pd.steps, validated: false };
      card.validated = validateCard(card, { dishName: pd.from, breakdown: base.parts, option, foods: [...byId.values()] }).length === 0;
      const r = await query<{ id: number }>(
        "INSERT INTO plant_dishes (cafeteria_id, menu_item_id, name, price_ngn, protein_g, option, card, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id",
        [cafe.id, base.id, pd.name, pd.priceNgn, option.after.proteinG, JSON.stringify(option), JSON.stringify(card), iso(new Date(weekStart - (1 + rand() * 6) * 86400_000))],
      );
      const dishId = Number(r[0].id);
      await tag("plant_dishes", dishId);
      count("plant_dishes");
      plantPlates.push({ cafeteriaId: cafe.id, name: pd.name, parts: base.parts.filter((x) => !pd.replace.includes(x.label)), option, dishId });

      // Reviews from different students.
      const reviewers = [...userIds].sort(() => rand() - 0.5).slice(0, Math.min(pd.reviews, userIds.length));
      for (const uid of reviewers) {
        const roll = rand();
        const stars = pd.rating === "great" ? (roll < 0.7 ? 5 : roll < 0.95 ? 4 : 3) : pd.rating === "good" ? (roll < 0.35 ? 5 : roll < 0.8 ? 4 : 3) : roll < 0.2 ? 4 : roll < 0.7 ? 3 : 2;
        const comment = rand() < 0.75 ? pick(DEMO_COMMENTS[stars >= 5 ? "great" : stars === 4 ? "good" : "mixed"]) : null;
        const nick = DEMO_USERS[userIds.indexOf(uid)]?.nickname ?? "Student";
        const rr = await query<{ id: number }>(
          "INSERT INTO reviews (plant_dish_id, device_id, nickname, stars, would_order_again, comment, created_at) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id",
          [dishId, `demo-device-${uid}`, nick, stars, stars >= 4 || (stars === 3 && rand() < 0.4) ? 1 : 0, comment, iso(thisWeek())],
        );
        await tag("reviews", rr[0].id);
        count("reviews");
      }
    }
  }

  // This week's scanned plant meals, so the leaderboard and Dex have life.
  for (const uid of userIds) {
    const meals = 2 + Math.floor(rand() * 4);
    for (let i = 0; i < meals && plantPlates.length; i++) {
      const plate = pick(plantPlates);
      const items = [
        ...plate.parts.map((x) => ({ foodId: x.foodId, label: x.label, grams: x.grams })),
        ...plate.option.adds.map((a) => ({ foodId: a.foodId as number | null, label: a.label, grams: a.grams })),
      ];
      const withProtein = items.map((x) => ({ ...x, protein: x.foodId ? Math.round((((foods.find((f) => f.id === x.foodId)?.protein_g_per_100g ?? 0) * x.grams) / 100) * 10) / 10 : null }));
      const total = Math.round(withProtein.reduce((s, x) => s + (x.protein ?? 0), 0) * 10) / 10;
      const groups = new Set(withProtein.map((x) => foods.find((f) => f.id === x.foodId)?.dex_group).filter((g) => g && g !== "Staple"));
      const s = await query<{ id: number }>(
        "INSERT INTO scans (user_id, dish_name, total_protein_g, is_complete_pair, diversity_count, created_at) VALUES (?, ?, ?, ?, ?, ?) RETURNING id",
        [uid, plate.name, total, plate.option.completeProtein ? 1 : 0, groups.size, iso(thisWeek())],
      );
      const scanId = Number(s[0].id);
      for (const x of withProtein)
        await query("INSERT INTO scan_items (scan_id, food_id, raw_label, estimated_grams, protein_g, corrected) VALUES (?, ?, ?, ?, ?, 0)", [scanId, x.foodId, x.label, x.grams, x.protein]);
      await tag("scans", scanId);
      count("scans");
    }
  }
  return counts;
}

export const DEMO_TABLES = TABLES;
