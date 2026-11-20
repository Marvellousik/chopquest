import { describe, expect, it } from "vitest";
import { buildCompanion } from "@/lib/companion";
import { pickDishes, ruleReply, type CampusDish } from "@/lib/companion-reply";

const NOW = new Date("2026-11-20T12:00:00Z");
const dish = (id: number, groups: string[], avgRating: number | null, name = `Dish ${id}`): CampusDish => ({ id, name, cafeteria: "Ase Cafe", priceNgn: 2500, avgRating, reviewCount: 4, groups });

describe("companion rule replies", () => {
  const ate = buildCompanion([{ id: 1, createdAt: "2026-11-18T12:00:00Z", foods: [{ dex_group: "Soy", type: "Alternative", food: "Soy chunks", local_name: null }] }], NOW);

  it("prefers a campus dish that brings a missing group over a better-rated one that doesn't", () => {
    const picks = pickDishes(ate, [dish(1, ["Soy"], 4.9), dish(2, ["Beans"], 3.5)]);
    expect(picks[0].id).toBe(2);
  });

  it("names what is missing and recommends a real campus dish with its price", () => {
    const r = ruleReply(ate, [dish(7, ["Beans"], 4.2, "Plant jollof")], "Ewa");
    expect(r.source).toBe("rules");
    expect(r.reply).toContain("missing beans");
    expect(r.reply).toContain("Plant jollof at Ase Cafe for ₦2,500");
    expect(r.dishIds).toEqual([7]);
  });

  it("works with no campus dishes and for a brand new user", () => {
    const fresh = ruleReply(buildCompanion([], NOW), [], "Ewa");
    expect(fresh.reply).toContain("Scan your next meal");
    expect(fresh.reply).toContain("moi moi or akara");
    expect(fresh.dishIds).toEqual([]);
  });

  it("never mentions calories or eating more", () => {
    const r = ruleReply(ate, [dish(1, ["Beans"], 4)], "Ewa");
    expect(r.reply).not.toMatch(/calorie|eat more|more food/i);
  });
});
