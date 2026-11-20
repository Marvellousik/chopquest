import { describe, expect, it } from "vitest";
import { DEFAULT_SWITCH_RATE_PCT, dishEconomics, kitchenTotals, recommendProteins } from "./profit";
import { findSwaps } from "./swap";
import { DEFAULT_LIMITS, type DishPart } from "./types";
import { foodByName, loadFoods } from "./test-foods";
import { hashCode, verifyCode } from "./server/access-code";

const FOODS = loadFoods({ Chicken: 6000, "Rice, milled": 1500, "Soy chunks (textured soy protein)": 3000, "Beans, boiled": 1200, "Moi moi": 2500 });
const id = (n: string) => foodByName(FOODS, n).id;
const jollof: DishPart[] = [
  { foodId: id("Rice, milled"), label: "Rice", grams: 100, role: "staple" },
  { foodId: id("Chicken"), label: "Chicken", grams: 120, role: "protein" },
];
const best = findSwaps(jollof, "Chicken jollof rice", DEFAULT_LIMITS, FOODS)[0];

describe("dishEconomics", () => {
  it("defaults to a 25% switch rate", () => {
    expect(DEFAULT_SWITCH_RATE_PCT).toBe(25);
  });

  it("works out margin and weekly profit from the swap, plates per week and the switch rate", () => {
    const e = dishEconomics({ menuItemId: 1, name: "Chicken jollof", priceNgn: 2000, platesPerWeek: 200, costPerPlateNgn: null, best });
    const change = best.before.costNgn! - best.after.costNgn!;
    expect(e.marginChangePerPlate).toBe(change);
    expect(e.plantPlatesPerWeek).toBe(50); // 25% of 200
    expect(e.weeklyProfitChange).toBe(50 * change);
    expect(e.monthlyProfitChange).toBe(Math.round(50 * change * 4.33));
    expect(e.costPerPlate.source).toBe("ingredients");
    expect(e.marginPerPlate.after! - e.marginPerPlate.before!).toBe(change);
    expect(e.missing).toEqual([]);
    expect(e.summary).toContain("25% of its buyers switch");
  });

  it("uses the manager's own cost per plate when given", () => {
    const e = dishEconomics({ menuItemId: 1, name: "Chicken jollof", priceNgn: 2000, platesPerWeek: 100, costPerPlateNgn: 1200, best });
    expect(e.costPerPlate).toMatchObject({ before: 1200, source: "manager" });
    expect(e.marginPerPlate.before).toBe(800);
    expect(e.costPerPlate.after).toBe(1200 - e.marginChangePerPlate!);
  });

  it("changes with the switch rate", () => {
    const at10 = dishEconomics({ menuItemId: 1, name: "J", priceNgn: 2000, platesPerWeek: 200, costPerPlateNgn: null, best }, 10);
    const at50 = dishEconomics({ menuItemId: 1, name: "J", priceNgn: 2000, platesPerWeek: 200, costPerPlateNgn: null, best }, 50);
    expect(at10.plantPlatesPerWeek).toBe(20);
    expect(at50.plantPlatesPerWeek).toBe(100);
  });

  it("never guesses: lists what's missing instead", () => {
    const noPrices = loadFoods();
    const opt = findSwaps(jollof.map((p) => ({ ...p })), "Chicken jollof rice", DEFAULT_LIMITS, noPrices)[0];
    const e = dishEconomics({ menuItemId: 1, name: "Chicken jollof", priceNgn: 2000, platesPerWeek: null, costPerPlateNgn: null, best: opt });
    expect(e.weeklyProfitChange).toBeNull();
    expect(e.marginChangePerPlate).toBeNull();
    expect(e.missing).toContain("plates sold per week");
    expect(e.missing.some((m) => m.startsWith("price for "))).toBe(true);
  });

  it("handles a dish with no swap", () => {
    const e = dishEconomics({ menuItemId: 2, name: "Beans and plantain", priceNgn: 1200, platesPerWeek: 50, costPerPlateNgn: null, best: null });
    expect(e.swap).toBeNull();
    expect(e.summary).toContain("no plant swap");
  });
});

describe("recommendProteins and totals", () => {
  it("ranks the proteins that make the most weekly profit across the menu", () => {
    const dishes = [
      dishEconomics({ menuItemId: 1, name: "Chicken jollof", priceNgn: 2000, platesPerWeek: 200, costPerPlateNgn: null, best }),
      dishEconomics({ menuItemId: 2, name: "Chicken fried rice", priceNgn: 2200, platesPerWeek: 100, costPerPlateNgn: null, best }),
    ];
    const recs = recommendProteins(dishes, FOODS);
    expect(recs[0].dishes).toEqual(["Chicken jollof", "Chicken fried rice"]);
    expect(recs[0].weeklyProfitChange).toBe((dishes[0].weeklyProfitChange ?? 0) + (dishes[1].weeklyProfitChange ?? 0));
    expect(recs[0].reason).toContain("best swap for 2 of your dishes");
    const t = kitchenTotals(dishes);
    expect(t.weeklyProfitChange).toBe(recs[0].weeklyProfitChange);
    expect(t.dishesCounted).toBe(2);
  });
});

describe("access codes", () => {
  it("verifies the right code and rejects wrong or malformed ones", () => {
    const h = hashCode("123456");
    expect(h.startsWith("scrypt$")).toBe(true);
    expect(verifyCode("123456", h)).toBe(true);
    expect(verifyCode("123457", h)).toBe(false);
    expect(verifyCode("12345", h)).toBe(false);
    expect(verifyCode("123456", null)).toBe(false);
    expect(verifyCode("123456", "garbage")).toBe(false);
    expect(hashCode("123456")).not.toBe(h); // salted
  });
});
