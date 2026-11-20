import { describe, expect, it } from "vitest";
import { buildCompanion, isCompleteMeal, type CompanionFood, type CompanionScan } from "@/lib/companion";

const f = (dex_group: string, type = "Plant", food = dex_group): CompanionFood => ({ dex_group, type, food, local_name: null });
const RICE = f("Staple", "Staple", "Rice, milled");
const YAM = f("Staple", "Staple", "Yam, fresh");
const NOW = new Date("2026-11-20T12:00:00Z"); // Friday; week began Mon 16 Nov (Lagos)
let id = 0;
const scan = (createdAt: string, ...foods: CompanionFood[]): CompanionScan => ({ id: ++id, createdAt, foods });

describe("isCompleteMeal", () => {
  it("grain + legume, soy alone, or animal alone", () => {
    expect(isCompleteMeal([RICE, f("Beans")])).toBe(true);
    expect(isCompleteMeal([f("Soy", "Alternative")])).toBe(true);
    expect(isCompleteMeal([f("Animal", "Animal")])).toBe(true);
    expect(isCompleteMeal([RICE])).toBe(false);
    expect(isCompleteMeal([YAM, f("Egusi")])).toBe(false); // yam is not a grain
  });
});

describe("buildCompanion", () => {
  it("starts as a sleepy egg", () => {
    const c = buildCompanion([], NOW);
    expect(c).toMatchObject({ points: 0, stage: "egg", mood: "sleepy", nextStageAt: 100, strength: 0, scans: 0 });
    expect(c.missingThisWeek[0]).toBe("Beans");
  });

  it("replays scans through the 7a rules: discovery, combo, complete protein", () => {
    // rice + beans: Discovery Beans 50 + New combo 15 + Complete 10 = 75
    const c = buildCompanion([scan("2026-11-17T12:00:00Z", RICE, f("Beans"))], NOW);
    expect(c.points).toBe(75);
    expect(c.lastRewards.map((r) => r.points).sort()).toEqual([10, 15, 50]);
    expect(c.stats).toEqual([{ group: "Beans", trait: "Strength", meals: 1, medal: null }]);
  });

  it("hatches past 100 points and never awards a group twice per scan", () => {
    const c = buildCompanion(
      [scan("2026-11-17T12:00:00Z", RICE, f("Beans"), f("Beans")), scan("2026-11-18T12:00:00Z", f("Soy", "Alternative"))],
      NOW,
    );
    // 75 + (Discovery Soy 50 + combo 15 + complete 10) = 150
    expect(c.points).toBe(150);
    expect(c.stage).toBe("young");
    expect(c.stats.find((s) => s.group === "Beans")?.meals).toBe(1);
  });

  it("mood comes from this week only; missing groups exclude what was eaten this week", () => {
    const c = buildCompanion(
      [
        scan("2026-11-10T12:00:00Z", f("Beans"), f("Soy", "Alternative"), f("Egusi")), // last week
        scan("2026-11-19T12:00:00Z", f("Groundnut")),
      ],
      NOW,
    );
    expect(c.weeklyDiversity).toBe(1);
    expect(c.mood).toBe("content");
    expect(c.thisWeek).toEqual(["Groundnut"]);
    expect(c.missingThisWeek).not.toContain("Groundnut");
    expect(c.missingThisWeek).toContain("Beans");
    expect(c.stage).not.toBe("egg"); // lifetime points keep the stage
  });

  it("animal protein earns the same as plant and never lowers anything", () => {
    const plant = buildCompanion([scan("2026-11-17T12:00:00Z", f("Beans"))], NOW).points;
    const animal = buildCompanion([scan("2026-11-17T12:00:00Z", f("Animal", "Animal"))], NOW).points;
    expect(animal).toBeGreaterThanOrEqual(plant);
  });

  it("strength grows with traits and medals, capped at 100", () => {
    const many = Array.from({ length: 30 }, (_, i) =>
      scan(`2026-10-${String((i % 28) + 1).padStart(2, "0")}T12:00:00Z`, ...["Beans", "Soy", "Bambara", "Groundnut", "Egusi", "Mushroom", "Iru", "Tigernut", "Pigeon pea"].map((g) => f(g))),
    );
    const c = buildCompanion(many, NOW);
    expect(c.strength).toBe(100);
    expect(c.stage).toBe("evolved");
    expect(c.nextStageAt).toBeNull();
  });
});
