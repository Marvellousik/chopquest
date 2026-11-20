// What the companion says when the AI is unavailable (no key, no credits, offline):
// a rule-based answer from the same facts the AI gets. Pure, so it's tested and always works.

import type { Companion } from "@/lib/companion";

export type CampusDish = {
  id: number;
  name: string;
  cafeteria: string;
  priceNgn: number;
  avgRating: number | null;
  reviewCount: number;
  groups: string[]; // protein groups the swap adds, e.g. ["Soy"]
};

export type ChatReply = { reply: string; dishIds: number[]; source: "ai" | "rules" };

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

/** Best campus dishes for this companion: ones that bring a missing group first, then by rating. */
export function pickDishes(c: Companion, dishes: CampusDish[], n = 2): CampusDish[] {
  const missing = new Set(c.missingThisWeek);
  const score = (d: CampusDish) => (d.groups.some((g) => missing.has(g)) ? 10 : 0) + (d.avgRating ?? 3) + Math.min(d.reviewCount, 10) / 10;
  return [...dishes].sort((a, b) => score(b) - score(a)).slice(0, n);
}

export function ruleReply(c: Companion, dishes: CampusDish[], petName: string): ChatReply {
  const picks = pickDishes(c, dishes);
  const want = c.missingThisWeek.slice(0, 2);
  const parts: string[] = [];

  if (c.scans === 0) parts.push(`Hi, I'm ${petName}! Scan your next meal and I'll start growing.`);
  else if (c.mood === "happy") parts.push(`We've had ${c.weeklyDiversity} protein groups this week. I feel strong!`);
  else if (c.mood === "content") parts.push(`${c.weeklyDiversity} protein ${c.weeklyDiversity === 1 ? "group" : "groups"} so far this week. One more and I'll be really happy.`);
  else parts.push("I'm a bit sleepy: no protein groups yet this week.");

  if (want.length) parts.push(`I'm missing ${want.map((g) => g.toLowerCase()).join(" and ")} this week.`);
  if (picks.length) {
    const d = picks[0];
    parts.push(`Try the ${d.name} at ${d.cafeteria} for ${naira(d.priceNgn)}${d.avgRating ? `, rated ${d.avgRating.toFixed(1)} by students` : ""}.`);
  } else if (want[0]) {
    parts.push(`Easy win: add ${want[0] === "Beans" ? "moi moi or akara" : want[0] === "Soy" ? "awara or soy chunks" : want[0].toLowerCase()} to your next meal.`);
  }
  return { reply: parts.join(" "), dishIds: picks.map((d) => d.id), source: "rules" };
}
