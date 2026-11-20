import { describe, expect, it } from "vitest";
import type { Food } from "@/lib/foods";
import { matchFood, norm } from "@/lib/match";

describe("norm", () => {
  it("lowercases and trims", () => {
    expect(norm("  Jollof Rice ")).toBe("jollof rice");
  });

  it("turns punctuation into single spaces", () => {
    expect(norm("Kuli-kuli (groundnut cake)")).toBe("kuli kuli groundnut cake");
  });

  it("strips accents", () => {
    expect(norm("Ẹ̀wà")).toBe("ewa");
  });

  it("handles null and undefined", () => {
    expect(norm(null)).toBe("");
    expect(norm(undefined)).toBe("");
  });
});

// A few rows copied from data/protein_db.csv, enough to check matching without a database.
let nextId = 1;
const food = (name: string, local: string, dex_group: string, type: Food["type"]): Food => ({
  id: nextId++,
  food: name,
  local_name: local,
  dex_group,
  type,
  protein_g_per_100g: 0,
  price_ngn_per_kg: null,
});

const FOODS: Food[] = [
  food("Rice, milled", "Rice", "Staple", "Staple"),
  food("Plantain, ripe", "Dodo", "Staple", "Staple"),
  food("Chicken", "Chicken", "Animal", "Animal"),
  food("Moi moi", "Moin moin", "Beans", "Plant"),
  food("Soy cheese / Nigerian tofu", "Awara", "Soy", "Alternative"),
  food("Kuli-kuli (groundnut cake)", "Kuli-kuli", "Groundnut", "Plant"),
];

const match = (label: string, local?: string) => matchFood(label, local, FOODS)?.food ?? null;

describe("matchFood", () => {
  it("maps dish names to their ingredient row", () => {
    expect(match("Jollof rice")).toBe("Rice, milled");
    expect(match("Fried plantain", "dodo")).toBe("Plantain, ripe");
  });

  it("matches local names", () => {
    expect(match("tofu", "awara")).toBe("Soy cheese / Nigerian tofu");
    expect(match("Kuli kuli")).toBe("Kuli-kuli (groundnut cake)");
  });

  it("finds the food inside a longer label", () => {
    expect(match("Fried chicken drumstick")).toBe("Chicken");
  });

  it("returns null for unknown food so the user picks it", () => {
    expect(match("Chocolate cake")).toBeNull();
  });
});
