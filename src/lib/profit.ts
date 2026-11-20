// Profit report for a cafeteria: what switching each dish to its best plant swap does to cost,
// margin and weekly profit. Plain functions (no database), so the report and /demo share them.
// Every money figure is an estimate; anything we can't compute is null with a reason, never guessed.
import { naira } from "./kitchen-copy";
import type { Food, SwapOption } from "./types";

export const DEFAULT_SWITCH_RATE_PCT = 25;
export const WEEKS_PER_MONTH = 4.33;
export const WEEKS_PER_SEMESTER = 15;

export type DishInput = {
  menuItemId: number;
  name: string;
  priceNgn: number; // what students pay
  platesPerWeek: number | null; // from the manager
  costPerPlateNgn: number | null; // from the manager, if known
  best: SwapOption | null; // engine's top swap for this dish (with this cafeteria's prices)
};

export type DishEconomics = {
  menuItemId: number;
  name: string;
  priceNgn: number;
  swap: string | null; // "Soya chunks 60 g instead of Chicken 120 g"
  mainFoodId: number | null;
  costPerPlate: { before: number | null; after: number | null; source: "manager" | "ingredients" | null };
  marginPerPlate: { before: number | null; after: number | null };
  marginChangePerPlate: number | null; // + = more profit per plant plate
  plantPlatesPerWeek: number | null;
  weeklyProfitChange: number | null;
  monthlyProfitChange: number | null;
  semesterProfitChange: number | null;
  proteinKeptPct: number | null;
  completeProtein: boolean | null;
  extraPrepMin: number | null;
  missing: string[]; // what the manager still needs to fill in for full numbers
  summary: string; // one plain sentence
};

const round = (n: number) => Math.round(n);

/** The economics of switching one dish to its best plant swap. */
export function dishEconomics(d: DishInput, switchRatePct = DEFAULT_SWITCH_RATE_PCT): DishEconomics {
  const o = d.best;
  const missing: string[] = [];
  const base: DishEconomics = {
    menuItemId: d.menuItemId,
    name: d.name,
    priceNgn: d.priceNgn,
    swap: null,
    mainFoodId: null,
    costPerPlate: { before: null, after: null, source: null },
    marginPerPlate: { before: null, after: null },
    marginChangePerPlate: null,
    plantPlatesPerWeek: null,
    weeklyProfitChange: null,
    monthlyProfitChange: null,
    semesterProfitChange: null,
    proteinKeptPct: null,
    completeProtein: null,
    extraPrepMin: null,
    missing,
    summary: "",
  };
  if (!o) {
    base.summary = `${d.name}: no plant swap fits your limits yet.`;
    return base;
  }

  const adds = o.adds.map((a) => `${a.label} ${a.grams} g`).join(" + ");
  const outs = o.replaces.map((p) => `${p.label} ${p.grams} g`).join(" + ");
  base.swap = `${adds} instead of ${outs}`;
  base.mainFoodId = [...o.adds].sort((a, b) => b.grams - a.grams)[0]?.foodId ?? null;
  base.proteinKeptPct = o.before.proteinG > 0 ? round((o.after.proteinG / o.before.proteinG) * 100) : null;
  base.completeProtein = o.completeProtein;
  base.extraPrepMin = o.extraPrepMin;

  // Ingredient cost change per plate = meat taken out - plant protein put in (from the engine).
  const ingBefore = o.before.costNgn;
  const ingAfter = o.after.costNgn;
  const change = ingBefore != null && ingAfter != null ? ingBefore - ingAfter : null;
  if (change == null) missing.push(...o.priceMissing.map((f) => `price for ${f}`));
  base.marginChangePerPlate = change == null ? null : round(change);

  // Cost per plate: the manager's own figure if given, else our ingredient estimate.
  if (d.costPerPlateNgn != null) {
    base.costPerPlate = { before: round(d.costPerPlateNgn), after: change == null ? null : round(d.costPerPlateNgn - change), source: "manager" };
  } else if (ingBefore != null && ingAfter != null) {
    base.costPerPlate = { before: round(ingBefore), after: round(ingAfter), source: "ingredients" };
  }
  const { before, after } = base.costPerPlate;
  base.marginPerPlate = { before: before == null ? null : round(d.priceNgn - before), after: after == null ? null : round(d.priceNgn - after) };

  if (d.platesPerWeek == null) missing.push("plates sold per week");
  else base.plantPlatesPerWeek = round((d.platesPerWeek * switchRatePct) / 100);

  if (base.plantPlatesPerWeek != null && change != null) {
    base.weeklyProfitChange = round(base.plantPlatesPerWeek * change);
    base.monthlyProfitChange = round(base.weeklyProfitChange * WEEKS_PER_MONTH);
    base.semesterProfitChange = round(base.weeklyProfitChange * WEEKS_PER_SEMESTER);
  }

  base.summary =
    change == null
      ? `${d.name}: ${base.swap}. Add the missing prices to see the profit.`
      : `${d.name}: ${base.swap} ${change >= 0 ? "saves" : "costs"} ${naira(Math.abs(change))} a plate` +
        (base.weeklyProfitChange != null
          ? `, about ${naira(Math.abs(base.weeklyProfitChange))} ${base.weeklyProfitChange >= 0 ? "more" : "less"} profit a week if ${switchRatePct}% of its buyers switch.`
          : ". Add plates sold per week to see the weekly profit.");
  return base;
}

export type ProteinRecommendation = {
  foodId: number;
  food: string;
  localName: string | null;
  dishes: string[]; // dishes where it is the best swap
  weeklyProfitChange: number | null; // summed over those dishes (null if none can be priced)
  avgProteinKeptPct: number | null;
  reason: string;
};

/** Top alternative proteins for this kitchen: ranked by weekly profit across the menu, then by dishes it fits. */
export function recommendProteins(dishes: DishEconomics[], foods: Food[], limit = 3): ProteinRecommendation[] {
  const byId = new Map(foods.map((f) => [f.id, f]));
  const groups = new Map<number, DishEconomics[]>();
  for (const d of dishes) {
    if (d.mainFoodId == null) continue;
    groups.set(d.mainFoodId, [...(groups.get(d.mainFoodId) ?? []), d]);
  }
  const recs: ProteinRecommendation[] = [...groups].map(([foodId, ds]) => {
    const f = byId.get(foodId);
    const priced = ds.filter((d) => d.weeklyProfitChange != null);
    const weekly = priced.length ? priced.reduce((s, d) => s + (d.weeklyProfitChange ?? 0), 0) : null;
    const kept = ds.filter((d) => d.proteinKeptPct != null);
    const avgKept = kept.length ? round(kept.reduce((s, d) => s + (d.proteinKeptPct ?? 0), 0) / kept.length) : null;
    const name = f?.local_name ?? f?.food ?? "This protein";
    return {
      foodId,
      food: f?.food ?? String(foodId),
      localName: f?.local_name ?? null,
      dishes: ds.map((d) => d.name),
      weeklyProfitChange: weekly,
      avgProteinKeptPct: avgKept,
      reason:
        `${name} is the best swap for ${ds.length} of your dishes` +
        (weekly != null ? `, about ${naira(Math.abs(weekly))} ${weekly >= 0 ? "more" : "less"} profit a week together` : "") +
        (avgKept != null ? `, keeping about ${avgKept}% of the protein.` : "."),
    };
  });
  return recs
    .sort((a, b) => (b.weeklyProfitChange ?? -Infinity) - (a.weeklyProfitChange ?? -Infinity) || b.dishes.length - a.dishes.length)
    .slice(0, limit);
}

export type KitchenTotals = { weeklyProfitChange: number; monthlyProfitChange: number; semesterProfitChange: number; dishesCounted: number; dishesMissingData: number };

export function kitchenTotals(dishes: DishEconomics[]): KitchenTotals {
  const counted = dishes.filter((d) => d.weeklyProfitChange != null && (d.weeklyProfitChange ?? 0) > 0);
  const weekly = counted.reduce((s, d) => s + (d.weeklyProfitChange ?? 0), 0);
  return {
    weeklyProfitChange: weekly,
    monthlyProfitChange: round(weekly * WEEKS_PER_MONTH),
    semesterProfitChange: round(weekly * WEEKS_PER_SEMESTER),
    dishesCounted: counted.length,
    dishesMissingData: dishes.filter((d) => d.swap && d.weeklyProfitChange == null).length,
  };
}
