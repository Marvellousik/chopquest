import { describe, expect, it } from "vitest";
import { bayesianRating, rankCafeterias } from "./ranking";

const cafe = (cafeteriaId: number, reviewCount: number, avg: number, plantDishCount = 1) => ({
  cafeteriaId, reviewCount, starSum: Math.round(reviewCount * avg), plantDishCount,
});

describe("bayesianRating", () => {
  it("pulls a cafeteria with few reviews toward a neutral 3 stars", () => {
    expect(bayesianRating({ reviewCount: 1, starSum: 5 })).toBeCloseTo((5 * 3 + 5) / 6);
    expect(bayesianRating({ reviewCount: 0, starSum: 0 })).toBe(3);
  });
});

describe("rankCafeterias", () => {
  it("ranks twenty 4-star reviews above one 5-star review", () => {
    const ranked = rankCafeterias([cafe(1, 1, 5), cafe(2, 20, 4)]);
    expect(ranked[0].cafeteriaId).toBe(2);
  });

  it("puts cafeterias with no reviews at the bottom as getting started", () => {
    const ranked = rankCafeterias([cafe(1, 0, 0, 3), cafe(2, 3, 3)]);
    expect(ranked.map((r) => r.cafeteriaId)).toEqual([2, 1]);
    expect(ranked[1].gettingStarted).toBe(true);
    expect(ranked[1].avgRating).toBeNull();
  });

  it("gives a small, capped bonus for more plant dishes", () => {
    const ranked = rankCafeterias([cafe(1, 10, 4, 1), cafe(2, 10, 4, 9)]);
    expect(ranked[0].cafeteriaId).toBe(2);
    expect(ranked[0].score - ranked[1].score).toBeCloseTo(0.2); // +0.3 cap vs +0.1
  });

  it("is stable for an empty board", () => {
    expect(rankCafeterias([])).toEqual([]);
    const ranked = rankCafeterias([cafe(3, 0, 0, 0), cafe(1, 0, 0, 0)]);
    expect(ranked.map((r) => r.cafeteriaId)).toEqual([1, 3]);
  });
});
