import { describe, expect, it } from "vitest";
import {
  comboKey,
  computeRewards,
  DEX_GROUPS,
  lagosWeekStart,
  lagosWeekStartDate,
  medalFor,
  petMood,
  petStage,
  proteinGroups,
  totalPoints,
  traitFor,
  weeklyDiversity,
  type RewardInput,
} from "./rewards";

const base: RewardInput = {
  mealGroups: [],
  pairingComplete: false,
  completedQuestIds: [],
  dexCounts: {},
  pastCombos: [],
  alreadyRewarded: false,
};
const run = (over: Partial<RewardInput>) => computeRewards({ ...base, ...over });
const reasons = (over: Partial<RewardInput>) => run(over).rewards.map((r) => `${r.reason} ${r.points}`);

describe("protein groups and combos", () => {
  it("drops Staple, blanks and duplicates", () => {
    expect(proteinGroups(["Staple", "Beans", null, "Beans", "Animal", undefined])).toEqual(["Animal", "Beans"]);
  });
  it("combo key ignores order", () => {
    expect(comboKey(["Beans", "Animal"])).toBe(comboKey(["Animal", "Beans", "Staple"]));
  });
});

describe("discovery", () => {
  it("+50 the first time a group appears, with its trait", () => {
    const r = run({ mealGroups: ["Soy"], pastCombos: ["Soy"] }).rewards;
    expect(r).toEqual([{ reason: "Discovery: Soy unlocked, Defense", points: 50, dexGroup: "Soy" }]);
  });
  it("Animal is discovered with base stats only (no trait), never penalised", () => {
    expect(reasons({ mealGroups: ["Animal"], pastCombos: ["Animal"] })).toEqual(["Discovery: Animal 50"]);
    expect(traitFor("Animal")).toBeNull();
  });
  it("no discovery for a group already in the Dex", () => {
    expect(reasons({ mealGroups: ["Beans"], dexCounts: { Beans: 1 }, pastCombos: ["Beans"] })).toEqual([]);
  });
  it("Staple never counts as a discovery", () => {
    expect(run({ mealGroups: ["Staple"] })).toEqual({ rewards: [], dexUpdates: [], combo: null });
  });
});

describe("mastery", () => {
  const at = (before: number) => reasons({ mealGroups: ["Beans"], dexCounts: { Beans: before }, pastCombos: ["Beans"] });
  it("Bronze +20 at the 3rd meal", () => expect(at(2)).toEqual(["Bronze mastery: Beans 20"]));
  it("Silver +40 at the 10th meal", () => expect(at(9)).toEqual(["Silver mastery: Beans 40"]));
  it("Gold +80 at the 25th meal", () => expect(at(24)).toEqual(["Gold mastery: Beans 80"]));
  it("nothing between or after thresholds", () => {
    expect(at(3)).toEqual([]);
    expect(at(25)).toEqual([]);
  });
  it("medalFor", () => {
    expect([2, 3, 9, 10, 24, 25, 100].map(medalFor)).toEqual([null, "Bronze", "Bronze", "Silver", "Silver", "Gold", "Gold"]);
  });
});

describe("dex_progress updates", () => {
  it("insert on first sight, otherwise +1, once per scan per group", () => {
    const { dexUpdates } = run({ mealGroups: ["Beans", "Beans", "Beans", "Animal", "Staple"], dexCounts: { Animal: 4 } });
    expect(dexUpdates).toEqual([
      { dexGroup: "Animal", mealCount: 5, isNew: false },
      { dexGroup: "Beans", mealCount: 1, isNew: true },
    ]);
  });
});

describe("quests, combos and complete protein", () => {
  it("+30 per completed quest, once each", () => {
    expect(reasons({ completedQuestIds: [7, 7, 8] })).toEqual(["Quest completed 30", "Quest completed 30"]);
  });
  it("+15 for a new combo, including a single group", () => {
    expect(reasons({ mealGroups: ["Beans"], dexCounts: { Beans: 1 } })).toEqual(["New combo: Beans 15"]);
    expect(reasons({ mealGroups: ["Beans", "Animal"], dexCounts: { Beans: 1, Animal: 1 }, pastCombos: ["Beans", "Animal"] })).toEqual([
      "New combo: Animal + Beans 15",
    ]);
  });
  it("no combo reward for a set already eaten together", () => {
    expect(reasons({ mealGroups: ["Animal", "Beans"], dexCounts: { Beans: 1, Animal: 1 }, pastCombos: ["Animal+Beans"] })).toEqual([]);
  });
  it("+10 when the meal passes the pairing check", () => {
    expect(reasons({ pairingComplete: true })).toEqual(["Complete protein 10"]);
  });
});

describe("never twice, never for eating more", () => {
  it("awards nothing if points_log already has this scan", () => {
    const r = run({ mealGroups: ["Soy", "Beans"], pairingComplete: true, completedQuestIds: [1], alreadyRewarded: true });
    expect(r.rewards).toEqual([]);
    expect(r.dexUpdates).toEqual([]);
  });
  it("a bigger plate of the same groups earns exactly the same", () => {
    const small = run({ mealGroups: ["Beans", "Staple"], pairingComplete: true });
    const big = run({ mealGroups: ["Beans", "Beans", "Beans", "Staple", "Staple"], pairingComplete: true });
    expect(totalPoints(big.rewards)).toBe(totalPoints(small.rewards));
  });
});

describe("new user scans the 3 demo meals", () => {
  it("jollof + plantain + chicken, rice + beans, bread + egg", () => {
    const dexCounts: Record<string, number> = {};
    const pastCombos: string[] = [];
    const meals = [
      { groups: ["Staple", "Staple", "Animal"], complete: true }, // jollof rice, dodo, chicken
      { groups: ["Staple", "Beans"], complete: true }, // rice + beans (grain + legume)
      { groups: ["Staple", "Animal"], complete: true }, // bread + egg
    ];
    const perMeal = meals.map((m) => {
      const r = computeRewards({ ...base, mealGroups: m.groups, pairingComplete: m.complete, dexCounts, pastCombos });
      r.dexUpdates.forEach((u) => (dexCounts[u.dexGroup] = u.mealCount));
      if (r.combo) pastCombos.push(r.combo);
      return r.rewards.map((x) => x.reason);
    });
    expect(perMeal).toEqual([
      ["Discovery: Animal", "New combo: Animal", "Complete protein"],
      ["Discovery: Beans unlocked, Strength", "New combo: Beans", "Complete protein"],
      ["Complete protein"],
    ]);
    expect(dexCounts).toEqual({ Animal: 2, Beans: 1 });
  });
});

describe("Lagos week (Monday reset, WAT = UTC+1)", () => {
  it("Sunday 23:30 Lagos is still last week; Monday 00:00 Lagos starts a new one", () => {
    // Sun 2026-11-22 23:30 WAT = 22:30 UTC
    expect(lagosWeekStartDate(new Date("2026-11-22T22:30:00Z"))).toBe("2026-11-16");
    // Mon 2026-11-23 00:00 WAT = Sun 23:00 UTC
    expect(lagosWeekStartDate(new Date("2026-11-22T23:00:00Z"))).toBe("2026-11-23");
    expect(lagosWeekStart(new Date("2026-11-22T23:00:00Z")).toISOString()).toBe("2026-11-22T23:00:00.000Z");
  });

  it("weeklyDiversity counts distinct non-Staple groups this week only", () => {
    const now = new Date("2026-11-25T12:00:00Z"); // Wednesday
    const meals = [
      { createdAt: "2026-11-22T22:59:00Z", groups: ["Soy"] }, // Sun 23:59 WAT, last week
      { createdAt: "2026-11-22T23:00:00Z", groups: ["Beans", "Staple"] }, // Mon 00:00 WAT
      { createdAt: "2026-11-24T08:00:00Z", groups: ["Beans", "Animal"] },
      { createdAt: "2026-11-25T11:00:00Z", groups: ["Staple"] },
    ];
    expect(weeklyDiversity(meals, now)).toBe(2);
    expect(weeklyDiversity([], now)).toBe(0);
  });
});

describe("pet", () => {
  it("stage: egg < 100, young 100-399, evolved 400+", () => {
    expect([0, 99, 100, 399, 400, 5000].map(petStage)).toEqual(["egg", "egg", "young", "young", "evolved", "evolved"]);
  });
  it("mood: 3+ happy, 1-2 content, 0 sleepy", () => {
    expect([0, 1, 2, 3, 9].map(petMood)).toEqual(["sleepy", "content", "content", "happy", "happy"]);
  });
  it("Dex has 10 groups: 9 with traits + Animal", () => {
    expect(DEX_GROUPS).toHaveLength(10);
    expect(DEX_GROUPS.filter(traitFor)).toHaveLength(9);
  });
});
