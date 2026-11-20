// Kitchen admin data (server only): profile, menu numbers, own prices, where to buy, profit report.
import { getDb, query } from "@/lib/db";
import { listFoods } from "@/lib/foods-db";
import { findSwaps } from "@/lib/swap";
import { DEFAULT_SWITCH_RATE_PCT, dishEconomics, kitchenTotals, recommendProteins } from "@/lib/profit";
import { ESTIMATE_NOTE, SWITCH_RATE_EXPLAINER, WHERE_TO_BUY_NOTE } from "@/lib/kitchen-copy";
import type { DishPart, Food, SwapLimits } from "@/lib/types";
import { DEFAULT_LIMITS } from "@/lib/types";

export type Goal = "more_margin" | "lower_price" | "balance";
export const GOALS: Goal[] = ["more_margin", "lower_price", "balance"];

export type KitchenProfile = {
  openDaysPerWeek: number | null;
  platesPerDay: number | null;
  goal: Goal | null;
  switchRatePct: number;
  maxExtraPrepMin: number;
  excludedFoodIds: number[];
};

export async function getProfile(cafeteriaId: number): Promise<KitchenProfile> {
  const rows = await query<{ open_days_per_week: number | null; plates_per_day: number | null; goal: Goal | null; switch_rate_pct: number; max_extra_prep_min: number; excluded_food_ids: string }>(
    "SELECT open_days_per_week, plates_per_day, goal, switch_rate_pct, max_extra_prep_min, excluded_food_ids FROM kitchen_profiles WHERE cafeteria_id = ?",
    [cafeteriaId],
  );
  const r = rows[0];
  let excluded: number[] = [];
  try {
    excluded = r ? (JSON.parse(r.excluded_food_ids) as number[]).filter((n) => Number.isInteger(n)) : [];
  } catch {
    excluded = [];
  }
  return {
    openDaysPerWeek: r?.open_days_per_week ?? null,
    platesPerDay: r?.plates_per_day ?? null,
    goal: r?.goal ?? null,
    switchRatePct: r?.switch_rate_pct ?? DEFAULT_SWITCH_RATE_PCT,
    maxExtraPrepMin: r?.max_extra_prep_min ?? DEFAULT_LIMITS.maxExtraPrepMin,
    excludedFoodIds: excluded,
  };
}

export async function saveProfile(cafeteriaId: number, p: KitchenProfile) {
  await query(
    `INSERT INTO kitchen_profiles (cafeteria_id, open_days_per_week, plates_per_day, goal, switch_rate_pct, max_extra_prep_min, excluded_food_ids, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
     ON CONFLICT (cafeteria_id) DO UPDATE SET open_days_per_week = excluded.open_days_per_week, plates_per_day = excluded.plates_per_day,
       goal = excluded.goal, switch_rate_pct = excluded.switch_rate_pct, max_extra_prep_min = excluded.max_extra_prep_min,
       excluded_food_ids = excluded.excluded_food_ids, updated_at = excluded.updated_at`,
    [cafeteriaId, p.openDaysPerWeek, p.platesPerDay, p.goal, p.switchRatePct, p.maxExtraPrepMin, JSON.stringify(p.excludedFoodIds)],
  );
}

/** Foods with this cafeteria's own prices on top of the market survey, minus foods it excluded. */
export async function foodsForCafeteria(cafeteriaId: number, excludedFoodIds: number[] = []): Promise<Food[]> {
  const [foods, own] = await Promise.all([
    listFoods(),
    query<{ food_id: number; price_ngn_per_kg: number }>("SELECT food_id, price_ngn_per_kg FROM cafeteria_prices WHERE cafeteria_id = ?", [cafeteriaId]),
  ]);
  const ownPrice = new Map(own.map((r) => [r.food_id, r.price_ngn_per_kg]));
  const excluded = new Set(excludedFoodIds);
  return foods
    .filter((f) => !(excluded.has(f.id) && (f.type === "Plant" || f.type === "Alternative")))
    .map((f) => (ownPrice.has(f.id) ? { ...f, price_ngn_per_kg: ownPrice.get(f.id)! } : f));
}

export async function limitsFor(cafeteriaId: number, overrides: Partial<SwapLimits> = {}): Promise<{ limits: SwapLimits; profile: KitchenProfile }> {
  const profile = await getProfile(cafeteriaId);
  return { profile, limits: { ...DEFAULT_LIMITS, maxExtraPrepMin: profile.maxExtraPrepMin, ...overrides } };
}

export type KitchenMenuItem = {
  id: number;
  name: string;
  priceNgn: number;
  isTopSeller: boolean;
  breakdown: DishPart[] | null;
  platesPerWeek: number | null;
  costPerPlateNgn: number | null;
  managerConfirmed: boolean;
};

export async function listKitchenMenu(cafeteriaId: number): Promise<KitchenMenuItem[]> {
  const rows = await query<{ id: number; name: string; price_ngn: number; is_top_seller: number; breakdown: string | null; plates_per_week: number | null; cost_per_plate_ngn: number | null; manager_confirmed: number | null }>(
    `SELECT m.id, m.name, m.price_ngn, m.is_top_seller, m.breakdown, s.plates_per_week, s.cost_per_plate_ngn, s.manager_confirmed
     FROM menu_items m LEFT JOIN menu_item_stats s ON s.menu_item_id = m.id
     WHERE m.cafeteria_id = ? ORDER BY m.is_top_seller DESC, s.plates_per_week DESC, m.name`,
    [cafeteriaId],
  );
  return rows.map((r) => {
    let breakdown: DishPart[] | null = null;
    try {
      breakdown = r.breakdown ? (JSON.parse(r.breakdown) as DishPart[]) : null;
    } catch {
      breakdown = null;
    }
    return {
      id: r.id,
      name: r.name,
      priceNgn: r.price_ngn,
      isTopSeller: Boolean(r.is_top_seller),
      breakdown,
      platesPerWeek: r.plates_per_week ?? null,
      costPerPlateNgn: r.cost_per_plate_ngn ?? null,
      managerConfirmed: Boolean(r.manager_confirmed),
    };
  });
}

export type MenuItemInput = { id?: number; name: string; priceNgn: number; isTopSeller: boolean; platesPerWeek: number | null; costPerPlateNgn: number | null; confirmed: boolean };

/** Add a dish or update one this cafeteria owns. Returns the dish id, or null if the id isn't theirs. */
export async function saveMenuItem(cafeteriaId: number, m: MenuItemInput): Promise<number | null> {
  const tx = await getDb().transaction("write");
  try {
    let id = m.id;
    if (id) {
      const own = await tx.execute({ sql: "SELECT 1 FROM menu_items WHERE id = ? AND cafeteria_id = ?", args: [id, cafeteriaId] });
      if (!own.rows.length) {
        await tx.rollback();
        return null;
      }
      await tx.execute({ sql: "UPDATE menu_items SET name = ?, price_ngn = ?, is_top_seller = ? WHERE id = ?", args: [m.name, m.priceNgn, m.isTopSeller ? 1 : 0, id] });
    } else {
      const rs = await tx.execute({
        sql: `INSERT INTO menu_items (cafeteria_id, name, price_ngn, is_top_seller) VALUES (?, ?, ?, ?)
              ON CONFLICT (cafeteria_id, name) DO UPDATE SET price_ngn = excluded.price_ngn, is_top_seller = excluded.is_top_seller
              RETURNING id`,
        args: [cafeteriaId, m.name, m.priceNgn, m.isTopSeller ? 1 : 0],
      });
      id = Number(rs.rows[0][0]);
    }
    await tx.execute({
      sql: `INSERT INTO menu_item_stats (menu_item_id, plates_per_week, cost_per_plate_ngn, manager_confirmed, updated_at)
            VALUES (?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
            ON CONFLICT (menu_item_id) DO UPDATE SET plates_per_week = excluded.plates_per_week, cost_per_plate_ngn = excluded.cost_per_plate_ngn,
              manager_confirmed = excluded.manager_confirmed, updated_at = excluded.updated_at`,
      args: [id, m.platesPerWeek, m.costPerPlateNgn, m.confirmed ? 1 : 0],
    });
    await tx.commit();
    return id;
  } finally {
    tx.close();
  }
}

export type OwnPrice = { foodId: number; food: string; unit: string | null; unitPriceNgn: number | null; unitWeightG: number | null; priceNgnPerKg: number; supplier: string | null };

export async function listOwnPrices(cafeteriaId: number): Promise<OwnPrice[]> {
  return query<OwnPrice>(
    `SELECT p.food_id AS foodId, f.food, p.unit, p.unit_price_ngn AS unitPriceNgn, p.unit_weight_g AS unitWeightG, p.price_ngn_per_kg AS priceNgnPerKg, p.supplier
     FROM cafeteria_prices p JOIN foods f ON f.id = p.food_id WHERE p.cafeteria_id = ? ORDER BY f.type, f.food`,
    [cafeteriaId],
  );
}

export async function saveOwnPrice(cafeteriaId: number, p: { foodId: number; unit: string | null; unitPriceNgn: number; unitWeightG: number; supplier: string | null }) {
  const perKg = Math.round((p.unitPriceNgn / p.unitWeightG) * 1000 * 100) / 100;
  await query(
    `INSERT INTO cafeteria_prices (cafeteria_id, food_id, price_ngn_per_kg, unit, unit_price_ngn, unit_weight_g, supplier, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
     ON CONFLICT (cafeteria_id, food_id) DO UPDATE SET price_ngn_per_kg = excluded.price_ngn_per_kg, unit = excluded.unit,
       unit_price_ngn = excluded.unit_price_ngn, unit_weight_g = excluded.unit_weight_g, supplier = excluded.supplier, updated_at = excluded.updated_at`,
    [cafeteriaId, p.foodId, perKg, p.unit, p.unitPriceNgn, p.unitWeightG, p.supplier],
  );
  return perKg;
}

export type ProteinSource = {
  area: string;
  placeType: string | null;
  placeName: string;
  landmark: string | null;
  whatToAskFor: string | null;
  unit: string | null;
  priceNgn: number | null;
  contact: string | null;
  howToBuy: string | null;
  status: "confirmed" | "likely";
  lastChecked: string | null;
};

export type ProteinWithSources = { foodId: number; food: string; localName: string | null; group: string; type: string; proteinPer100g: number; basis: string | null; priceNgnPerKg: number | null; sources: ProteinSource[] };

/** Every alternative protein with where to buy it: confirmed places first, campus before town. */
export async function proteinsWithSources(foodId?: number): Promise<ProteinWithSources[]> {
  const foods = (await listFoods()).filter((f) => (f.type === "Plant" || f.type === "Alternative") && (foodId == null || f.id === foodId));
  const rows = await query<ProteinSource & { foodId: number }>(
    `SELECT food_id AS foodId, area, place_type AS placeType, place_name AS placeName, landmark, what_to_ask_for AS whatToAskFor, unit,
            price_ngn AS priceNgn, contact, how_to_buy AS howToBuy, status, last_checked AS lastChecked
     FROM protein_sources ORDER BY CASE status WHEN 'confirmed' THEN 0 ELSE 1 END, CASE area WHEN 'On campus' THEN 0 ELSE 1 END, place_name`,
  );
  return foods
    .map((f) => ({
      foodId: f.id,
      food: f.food,
      localName: f.local_name,
      group: f.dex_group,
      type: f.type,
      proteinPer100g: f.protein_g_per_100g,
      basis: f.basis ?? null,
      priceNgnPerKg: f.price_ngn_per_kg,
      sources: rows.filter((r) => r.foodId === f.id).map(({ foodId: _f, ...s }) => s), // eslint-disable-line @typescript-eslint/no-unused-vars
    }))
    .sort((a, b) => a.group.localeCompare(b.group) || a.food.localeCompare(b.food));
}

/** The manager's full report: per-dish economics, top proteins (with where to buy), totals and the plain-language notes. */
export async function buildReport(cafeteriaId: number, switchRateOverride?: number) {
  const { profile, limits } = await limitsFor(cafeteriaId);
  const switchRatePct = switchRateOverride ?? profile.switchRatePct;
  const [foods, menu] = await Promise.all([foodsForCafeteria(cafeteriaId, profile.excludedFoodIds), listKitchenMenu(cafeteriaId)]);
  const dishes = menu.map((m) =>
    dishEconomics(
      {
        menuItemId: m.id,
        name: m.name,
        priceNgn: m.priceNgn,
        platesPerWeek: m.platesPerWeek,
        costPerPlateNgn: m.costPerPlateNgn,
        best: m.breakdown?.length ? (findSwaps(m.breakdown, m.name, limits, foods)[0] ?? null) : null,
      },
      switchRatePct,
    ),
  );
  const needsBreakdown = menu.filter((m) => !m.breakdown?.length).map((m) => ({ id: m.id, name: m.name }));
  const recs = recommendProteins(dishes, foods);
  const sources = recs.length ? await proteinsWithSources() : [];
  return {
    switchRate: { pct: switchRatePct, source: "assumed" as const, explainer: SWITCH_RATE_EXPLAINER },
    totals: kitchenTotals(dishes),
    recommendations: recs.map((r) => ({ ...r, whereToBuy: sources.find((s) => s.foodId === r.foodId)?.sources ?? [] })),
    dishes: dishes.sort((a, b) => (b.weeklyProfitChange ?? -Infinity) - (a.weeklyProfitChange ?? -Infinity)),
    needsBreakdown,
    notes: { estimates: ESTIMATE_NOTE, whereToBuy: WHERE_TO_BUY_NOTE },
  };
}
