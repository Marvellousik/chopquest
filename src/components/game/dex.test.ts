import { describe, expect, it } from "vitest";
import { DEX, medalFor, nextMedal } from "@/components/game/dex";

describe("Dex catalog", () => {
  it("has the 10 groups, Animal with base stats only", () => {
    expect(DEX).toHaveLength(10);
    expect(DEX.find((d) => d.group === "Animal")?.trait).toBeNull();
    expect(DEX.find((d) => d.group === "Soy")?.trait).toBe("Defense");
  });
});

describe("medalFor", () => {
  it.each([
    [1, null], [2, null], [3, "bronze"], [9, "bronze"],
    [10, "silver"], [24, "silver"], [25, "gold"], [100, "gold"],
  ])("%i meals -> %s", (n, medal) => {
    expect(medalFor(n)).toBe(medal);
  });
});

describe("nextMedal", () => {
  it("shows progress toward the next medal", () => {
    expect(nextMedal(1)).toMatchObject({ medal: "bronze", at: 3 });
    expect(nextMedal(4)).toMatchObject({ medal: "silver", at: 10 });
    expect(nextMedal(12)).toMatchObject({ medal: "gold", at: 25 });
  });
  it("is null once Gold", () => {
    expect(nextMedal(25)).toBeNull();
  });
});
