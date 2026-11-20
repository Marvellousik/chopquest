import { describe, expect, it } from "vitest";
import { buildDiet, lagosDate, mealIsComplete, type DietMeal } from "@/lib/diet";

const now = new Date("2026-11-20T15:00:00Z"); // Friday afternoon in Lagos
const meal = (id: number, at: string, items: DietMeal["items"]): DietMeal => ({
  id,
  at,
  dish: `Meal ${id}`,
  total: items.reduce((s, i) => s + (i.protein ?? 0), 0),
  items,
});
const rice = { label: "Rice", food: "Rice, milled", group: "Staple", type: "Staple" as const, grams: 90, protein: 6.4 };
const beans = { label: "Beans", food: "Beans, boiled", group: "Beans", type: "Plant" as const, grams: 150, protein: 12 };
const soy = { label: "Soya", food: "Soy chunks (textured soy protein)", group: "Soy", type: "Alternative" as const, grams: 40, protein: 20 };
const chicken = { label: "Chicken", food: "Chicken", group: "Animal", type: "Animal" as const, grams: 120, protein: 24 };
const mushroom = { label: "Mushroom", food: "Oyster mushroom, fresh", group: "Mushroom", type: "Alternative" as const, grams: 100, protein: 3 };

describe("buildDiet", () => {
  const meals = [
    meal(1, "2026-11-20T12:00:00Z", [rice, beans]),
    meal(2, "2026-11-19T12:00:00Z", [rice, soy]),
    meal(3, "2026-11-18T12:00:00Z", [rice, chicken]),
    meal(4, "2026-11-10T12:00:00Z", [rice, chicken]),
    meal(5, "2026-11-20T13:00:00Z", [mushroom]),
  ];
  const d = buildDiet(meals, now);

  it("fills an inventory slot for every group eaten, including new ones like mushroom", () => {
    const slot = (g: string) => d.inventory.find((s) => s.group === g)!;
    expect(slot("Mushroom").mealCount).toBe(1);
    expect(slot("Beans").mealCount).toBe(1);
    expect(slot("Animal").mealCount).toBe(2);
    expect(slot("Iru").mealCount).toBe(0);
    expect(d.untried).toContain("Iru");
    expect(d.untried).not.toContain("Mushroom");
  });

  it("buckets protein by source per Lagos day, today last", () => {
    expect(d.days).toHaveLength(14);
    expect(d.days.at(-1)!.date).toBe("2026-11-20");
    expect(d.days.at(-1)!.plant).toBe(12);
    expect(d.days.at(-1)!.alternative).toBe(3);
    expect(d.days.at(-1)!.meals).toBe(2);
    expect(d.days.at(-3)!.animal).toBe(24);
  });

  it("works out shares, variety, streak and complete meals", () => {
    expect(d.stats.meals).toBe(5);
    expect(d.stats.plantSharePct).toBe(Math.round((35 / 83) * 100));
    expect(d.stats.groupsThisWeek).toBe(4); // Beans, Soy, Animal, Mushroom
    expect(d.stats.groupsLastWeek).toBe(1);
    expect(d.stats.streakDays).toBe(3);
    expect(d.stats.completeMealsPct).toBe(80);
    expect(d.insights.some((i) => i.title === "Great variety")).toBe(true);
  });

  it("returns no insights when nothing is logged", () => {
    expect(buildDiet([], now).insights).toEqual([]);
  });
});

describe("helpers", () => {
  it("uses Lagos dates (UTC+1)", () => expect(lagosDate("2026-11-19T23:30:00Z")).toBe("2026-11-20"));
  it("rice and beans is complete, mushroom alone is not", () => {
    expect(mealIsComplete(meal(1, "2026-11-20T12:00:00Z", [rice, beans]))).toBe(true);
    expect(mealIsComplete(meal(2, "2026-11-20T12:00:00Z", [mushroom]))).toBe(false);
  });
});
