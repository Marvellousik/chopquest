import { describe, expect, it } from "vitest";
import { addonsFor, PROTEIN_ADDON, ADDONS } from "@/lib/addons";

const foods = (name: string) => [...addonsFor(name).keys()];

describe("addonsFor", () => {
  it("treats a protein sold on its own as an add-on, but not a dish that contains it", () => {
    expect(foods("Chicken")).toContain("Moi moi");
    expect(foods("Peppered chicken (large)")).toContain("Moi moi");
    expect(foods("Boiled egg")).toContain("Akara");
    expect(foods("Chicken shawarma single sausage")).not.toContain("Moi moi");
    expect(ADDONS[PROTEIN_ADDON].length).toBeGreaterThan(2);
  });

  it("offers more than tofu for soups and snacks on the real menus", () => {
    expect(foods("Egusi soup")).toEqual(expect.arrayContaining(["Melon seed, shelled", "Oyster mushroom, fresh"]));
    expect(foods("Seafood okro")).toContain("Oyster mushroom, fresh");
    expect(foods("Cheese burger")).toContain("Akara");
    expect(foods("Masa and egg sauce")).toContain("Kuli-kuli (groundnut cake)");
  });

  it("still knows nothing for a dish with no matching keyword", () => {
    expect(foods("French toast")).toEqual([]);
  });
});
