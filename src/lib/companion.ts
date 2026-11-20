// The companion (your bean pet) computed from what you actually ate. Pure: no DB, no network.
// It replays every scan through the 7a rules (src/lib/rewards.ts), so points, stage, mood and
// traits always follow the same scoring as everywhere else. Points never come from grams,
// calories or price; animal protein is never penalised; the pet never loses a stage.

import { computeRewards, DEX_GROUPS, medalFor, petMood, petStage, proteinGroups, traitFor, weeklyDiversity, type Medal, type PetMood, type PetStage, type Reward } from "@/lib/rewards";

export type CompanionFood = { dex_group: string; type: string; food: string; local_name: string | null };
export type CompanionScan = { id: number; createdAt: string; foods: CompanionFood[] };

const GRAIN = /\b(rice|maize|corn|sorghum|millet|wheat|bread|noodles?|spaghetti|pasta|tuwo|pap|ogi)\b/i;
const LEGUMES = new Set(["Beans", "Bambara", "Pigeon pea", "Groundnut"]);
export const PLANT_GROUPS = DEX_GROUPS.filter((g) => g !== "Animal");

/** Complete protein: a grain with a legume, or any soy, or any animal protein (project rule). */
export function isCompleteMeal(foods: CompanionFood[]): boolean {
  const groups = new Set(foods.map((f) => f.dex_group));
  if (groups.has("Soy") || groups.has("Animal")) return true;
  const grain = foods.some((f) => f.type === "Staple" && GRAIN.test(`${f.food} ${f.local_name ?? ""}`));
  return grain && [...groups].some((g) => LEGUMES.has(g));
}

export type Stat = { group: string; trait: string | null; meals: number; medal: Medal | null };

export type Companion = {
  points: number;
  stage: PetStage;
  mood: PetMood;
  /** Points needed for the next stage, or null when fully grown. */
  nextStageAt: number | null;
  weeklyDiversity: number;
  /** Protein groups eaten this Lagos week (Staple excluded). */
  thisWeek: string[];
  /** Plant groups NOT eaten this week, most familiar first: what the companion nudges toward. */
  missingThisWeek: string[];
  /** Every group ever eaten, with meal count and medal: the companion's strength. */
  stats: Stat[];
  /** Strength 0 to 100: share of the 9 plant traits unlocked, weighted by medals. Never goes down. */
  strength: number;
  scans: number;
  lastRewards: Reward[];
};

const STAGE_NEXT: Record<PetStage, number | null> = { egg: 100, young: 400, evolved: null };
const MEDAL_WEIGHT: Record<Medal, number> = { Bronze: 1.25, Silver: 1.5, Gold: 2 };
// Order to suggest missing groups: cheap and familiar in Nigerian kitchens first.
const FAMILIAR = ["Beans", "Soy", "Groundnut", "Egusi", "Bambara", "Iru", "Tigernut", "Pigeon pea", "Mushroom"];

export function buildCompanion(scans: CompanionScan[], now: Date = new Date()): Companion {
  const ordered = [...scans].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  const dexCounts: Record<string, number> = {};
  const pastCombos: string[] = [];
  let points = 0;
  let lastRewards: Reward[] = [];

  for (const s of ordered) {
    const r = computeRewards({
      mealGroups: s.foods.map((f) => f.dex_group),
      pairingComplete: isCompleteMeal(s.foods),
      completedQuestIds: [],
      dexCounts,
      pastCombos,
      alreadyRewarded: false,
    });
    for (const u of r.dexUpdates) dexCounts[u.dexGroup] = u.mealCount;
    if (r.combo) pastCombos.push(r.combo);
    points += r.rewards.reduce((t, x) => t + x.points, 0);
    lastRewards = r.rewards;
  }

  const meals = ordered.map((s) => ({ createdAt: s.createdAt, groups: s.foods.map((f) => f.dex_group) }));
  const diversity = weeklyDiversity(meals, now);
  const thisWeek = proteinGroups(
    meals.filter((m) => weeklyDiversity([m], now) > 0).flatMap((m) => m.groups),
  );

  const stats: Stat[] = DEX_GROUPS.filter((g) => dexCounts[g]).map((g) => ({ group: g, trait: traitFor(g), meals: dexCounts[g], medal: medalFor(dexCounts[g]) }));
  const weight = stats.filter((s) => s.trait).reduce((t, s) => t + (s.medal ? MEDAL_WEIGHT[s.medal] : 1), 0);
  const strength = Math.min(100, Math.round((weight / (PLANT_GROUPS.length * MEDAL_WEIGHT.Gold)) * 100));

  const stage = petStage(points);
  return {
    points,
    stage,
    mood: petMood(diversity),
    nextStageAt: STAGE_NEXT[stage],
    weeklyDiversity: diversity,
    thisWeek,
    missingThisWeek: FAMILIAR.filter((g) => !thisWeek.includes(g)),
    stats,
    strength,
    scans: ordered.length,
    lastRewards,
  };
}
