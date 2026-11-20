// Display catalog for the Protein Dex (task 7c). UI-only: colours, hints, blurbs.
// The rules (traits, medal thresholds) come from 7a's src/lib/rewards.ts.
import { MASTERY, medalFor as rulesMedalFor, traitFor } from "@/lib/rewards";

export type DexGroup =
  | "Beans" | "Soy" | "Bambara" | "Groundnut" | "Egusi"
  | "Mushroom" | "Iru" | "Tigernut" | "Pigeon pea" | "Animal";

export type DexEntry = {
  group: DexGroup;
  trait: string | null; // null = Animal, base stats only
  blurb: string; // what the trait does for the pet
  hint: string; // shown while locked: how to discover it
  color: string; // card accent
  tint: string; // card background once unlocked
};

const RAW: Omit<DexEntry, "trait">[] = [
  { group: "Beans", blurb: "Hits harder", hint: "Try akara, moi moi or ewa", color: "#b45309", tint: "#fef3c7" },
  { group: "Soy", blurb: "Leaf shield", hint: "Try awara or soy chunks", color: "#ca8a04", tint: "#fef9c3" },
  { group: "Bambara", blurb: "Plays longer", hint: "Try okpa", color: "#9a3412", tint: "#ffedd5" },
  { group: "Groundnut", blurb: "Extra bounce", hint: "Try kuli-kuli or groundnuts", color: "#c2410c", tint: "#ffedd5" },
  { group: "Egusi", blurb: "Wakes up faster", hint: "Try egusi soup", color: "#65a30d", tint: "#ecfccb" },
  { group: "Mushroom", blurb: "Sharp eyes", hint: "Try oyster mushroom", color: "#78716c", tint: "#f5f5f4" },
  { group: "Iru", blurb: "Tiny glasses", hint: "Try iru in your soup", color: "#7c2d12", tint: "#fde68a" },
  { group: "Tigernut", blurb: "Quick feet", hint: "Try kunun aya", color: "#a16207", tint: "#fef3c7" },
  { group: "Pigeon pea", blurb: "Nimble leaves", hint: "Try fiofio", color: "#15803d", tint: "#dcfce7" },
  { group: "Animal", blurb: "Base stats", hint: "Egg, chicken, fish or meat", color: "#be123c", tint: "#ffe4e6" },
];

export const DEX: DexEntry[] = RAW.map((d) => ({ ...d, trait: traitFor(d.group) }));

export const dexEntry = (group: string) => DEX.find((d) => d.group === group);

export type Medal = "bronze" | "silver" | "gold";
const MEDALS = MASTERY.map((m) => ({ medal: m.medal.toLowerCase() as Medal, at: m.at }));

export function medalFor(mealCount: number): Medal | null {
  return (rulesMedalFor(mealCount)?.toLowerCase() as Medal | undefined) ?? null;
}

/** Next medal and how far along the user is, for the progress bar. null once Gold. */
export function nextMedal(mealCount: number): { medal: Medal; at: number; progress: number } | null {
  const prev = [0, ...MEDALS.map((t) => t.at)];
  const i = MEDALS.findIndex((t) => mealCount < t.at);
  if (i === -1) return null;
  const from = prev[i];
  const { medal, at } = MEDALS[i];
  return { medal, at, progress: (mealCount - from) / (at - from) };
}

export const MEDAL_STYLE: Record<Medal, { label: string; fill: string; ring: string }> = {
  bronze: { label: "Bronze", fill: "#d97706", ring: "#92400e" },
  silver: { label: "Silver", fill: "#cbd5e1", ring: "#64748b" },
  gold: { label: "Gold", fill: "#facc15", ring: "#a16207" },
};
