// Rewards, Protein Dex progress, weekly diversity and pet state (task 7a, Dev 3).
// Pure functions only: no database, no network, so the offline /demo can run them in the browser.
// The server step reads history from the DB, calls computeRewards(), then writes what it returns.
//
// Scoring rules (CLAUDE.md): never reward eating more. Grams, calories and price never earn points.
// Animal protein is never penalised; cheap and expensive proteins earn the same; the pet never loses a stage.

// LOCAL TYPE until Dev 1's src/lib/types.ts lands on main; same shape as the agreed shared type.
export type Reward = { reason: string; points: number; dexGroup?: string };

export type PetStage = "egg" | "young" | "evolved";
export type PetMood = "happy" | "content" | "sleepy";

export const POINTS = {
  discovery: 50,
  bronze: 20,
  silver: 40,
  gold: 80,
  questCompleted: 30,
  newCombo: 15,
  completeProtein: 10,
} as const;

/** meal_count at which each medal is earned. */
export const MASTERY = [
  { medal: "Bronze", at: 3, points: POINTS.bronze },
  { medal: "Silver", at: 10, points: POINTS.silver },
  { medal: "Gold", at: 25, points: POINTS.gold },
] as const;
export type Medal = (typeof MASTERY)[number]["medal"];

/** Trait unlocked on discovery. Animal gets base stats only (no trait); Staple is not a protein group. */
export const TRAITS: Record<string, string> = {
  Beans: "Strength",
  Soy: "Defense",
  Bambara: "Stamina",
  Groundnut: "Energy",
  Egusi: "Recovery",
  Mushroom: "Focus",
  Iru: "Wisdom",
  Tigernut: "Speed",
  "Pigeon pea": "Agility",
};

/** The 10 Dex slots, in display order: 9 plant/alternative groups + Animal. */
export const DEX_GROUPS = [...Object.keys(TRAITS), "Animal"];

export const traitFor = (group: string): string | null => TRAITS[group] ?? null;

/** Distinct protein groups in a meal: drops Staple, blanks and duplicates, sorted for stable keys. */
export function proteinGroups(groups: (string | null | undefined)[]): string[] {
  return [...new Set(groups.filter((g): g is string => !!g && g !== "Staple"))].sort();
}

/** Key for a set of protein groups, e.g. ["Beans", "Animal"] -> "Animal+Beans". A single group is a combo too. */
export const comboKey = (groups: string[]): string => proteinGroups(groups).join("+");

/** Medal for a meal_count (highest reached), or null below Bronze. */
export function medalFor(mealCount: number): Medal | null {
  let medal: Medal | null = null;
  for (const m of MASTERY) if (mealCount >= m.at) medal = m.medal;
  return medal;
}

export type RewardInput = {
  /** dex_group of every matched item in this scan (duplicates and Staple allowed; they are cleaned here). */
  mealGroups: (string | null | undefined)[];
  /** Result of the pairing check for this meal. */
  pairingComplete: boolean;
  /** Quests that reached their target on this scan (Dev 2's quest-completed signal). */
  completedQuestIds: number[];
  /** dex_progress.meal_count per group BEFORE this scan. Missing = never eaten. */
  dexCounts: Record<string, number>;
  /** comboKey() of every earlier scan by this user. */
  pastCombos: string[];
  /** True if points_log already has rows for this scan_id: then nothing is awarded again. */
  alreadyRewarded: boolean;
};

export type DexUpdate = { dexGroup: string; mealCount: number; isNew: boolean };

export type RewardResult = {
  rewards: Reward[];
  /** Rows to upsert into dex_progress: insert when isNew, else set meal_count. Once per group per scan. */
  dexUpdates: DexUpdate[];
  combo: string | null;
};

/** Every reward this scan earns. Points depend only on which groups appear, never on grams or price. */
export function computeRewards(input: RewardInput): RewardResult {
  const groups = proteinGroups(input.mealGroups);
  const combo = groups.length ? comboKey(groups) : null;
  if (input.alreadyRewarded) return { rewards: [], dexUpdates: [], combo };

  const rewards: Reward[] = [];
  const dexUpdates: DexUpdate[] = [];

  for (const g of groups) {
    const before = input.dexCounts[g] ?? 0;
    const after = before + 1; // at most once per scan per group
    dexUpdates.push({ dexGroup: g, mealCount: after, isNew: before === 0 });

    if (before === 0) {
      const trait = traitFor(g);
      rewards.push({ reason: trait ? `Discovery: ${g} unlocked, ${trait}` : `Discovery: ${g}`, points: POINTS.discovery, dexGroup: g });
    }
    for (const m of MASTERY) {
      if (before < m.at && after >= m.at) rewards.push({ reason: `${m.medal} mastery: ${g}`, points: m.points, dexGroup: g });
    }
  }

  new Set(input.completedQuestIds).forEach(() => rewards.push({ reason: "Quest completed", points: POINTS.questCompleted }));

  if (combo && !input.pastCombos.includes(combo)) {
    rewards.push({ reason: `New combo: ${groups.join(" + ")}`, points: POINTS.newCombo });
  }

  if (input.pairingComplete) rewards.push({ reason: "Complete protein", points: POINTS.completeProtein });

  return { rewards, dexUpdates, combo };
}

export const totalPoints = (rows: { points: number }[]): number => rows.reduce((s, r) => s + r.points, 0);

// ---- Weeks: Monday to Sunday, Lagos time (WAT = UTC+1, no daylight saving) ----

const WAT_MS = 60 * 60 * 1000;
const DAY_MS = 24 * WAT_MS;

/** The instant (UTC) when the current Lagos week began: Monday 00:00 WAT. */
export function lagosWeekStart(now: Date = new Date()): Date {
  const lagos = new Date(now.getTime() + WAT_MS); // shift so UTC fields read as Lagos wall time
  const daysSinceMonday = (lagos.getUTCDay() + 6) % 7;
  const midnight = Date.UTC(lagos.getUTCFullYear(), lagos.getUTCMonth(), lagos.getUTCDate());
  return new Date(midnight - daysSinceMonday * DAY_MS - WAT_MS);
}

/** 'YYYY-MM-DD' of this week's Monday in Lagos (the format quests.week_start uses). */
export function lagosWeekStartDate(now: Date = new Date()): string {
  return new Date(lagosWeekStart(now).getTime() + WAT_MS).toISOString().slice(0, 10);
}

/** Distinct protein groups (Staple excluded) eaten in the current Lagos week. */
export function weeklyDiversity(meals: { createdAt: string | Date; groups: (string | null | undefined)[] }[], now: Date = new Date()): number {
  const start = lagosWeekStart(now).getTime();
  const end = start + 7 * DAY_MS;
  const seen = new Set<string>();
  for (const m of meals) {
    const t = new Date(m.createdAt).getTime();
    if (t >= start && t < end) proteinGroups(m.groups).forEach((g) => seen.add(g));
  }
  return seen.size;
}

// ---- Pet ----

/** Stage from lifetime points. Points are only ever added, so the stage never drops. */
export function petStage(totalPoints: number): PetStage {
  if (totalPoints >= 400) return "evolved";
  if (totalPoints >= 100) return "young";
  return "egg";
}

/** Mood from this week's diversity. A quiet week only makes the pet sleepy. */
export function petMood(diversity: number): PetMood {
  if (diversity >= 3) return "happy";
  if (diversity >= 1) return "content";
  return "sleepy";
}
