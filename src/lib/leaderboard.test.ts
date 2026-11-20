import { describe, expect, it } from "vitest";
import { buildLeaderboard, MIN_MEMBERS, rankMembers, weekStartIso, type LbMeal, type LbUser } from "@/lib/leaderboard";

// Thursday 19 Nov 2026, 12:00 Lagos (11:00 UTC). Week began Mon 16 Nov 00:00 Lagos = Sun 15 Nov 23:00 UTC.
const NOW = new Date("2026-11-19T11:00:00Z");
const THIS_WEEK = "2026-11-18T09:00:00.000Z";
const LAST_WEEK = "2026-11-12T09:00:00.000Z";

// 3 groups, 10 users.
const users: LbUser[] = [
  { userId: 1, groupName: "Hall A" }, { userId: 2, groupName: "Hall A" }, { userId: 3, groupName: "Hall A" },
  { userId: 4, groupName: "Hall B" }, { userId: 5, groupName: "Hall B" }, { userId: 6, groupName: "Hall B" }, { userId: 7, groupName: "Hall B" },
  { userId: 8, groupName: "Microbiology" }, { userId: 9, groupName: "Microbiology" }, { userId: 10, groupName: "Microbiology" },
];
const meal = (userId: number, groups: string[], createdAt = THIS_WEEK): LbMeal => ({ userId, createdAt, groups });

const meals: LbMeal[] = [
  // Hall A: 3 + 2 + 1 = 6 / 3 = 2.0
  meal(1, ["Beans", "Staple", "Animal"]), meal(1, ["Soy"]),
  meal(2, ["Groundnut", "Staple"]), meal(2, ["Animal"]),
  meal(3, ["Beans"]),
  // Hall B: 4 + 4 + 0 + 0 = 8 / 4 = 2.0 (ties Hall A on average)
  meal(4, ["Beans", "Soy", "Egusi", "Animal"]),
  meal(5, ["Iru", "Tigernut"]), meal(5, ["Mushroom", "Bambara"]),
  meal(6, ["Beans", "Soy", "Egusi", "Animal"], LAST_WEEK), // last week: doesn't count
  // Microbiology: 3 + 3 + 2 = 8 / 3 = 2.7
  meal(8, ["Beans", "Soy", "Animal"]), meal(9, ["Egusi", "Iru", "Animal"]), meal(10, ["Soy", "Staple", "Animal"]),
];

describe("buildLeaderboard", () => {
  const lb = buildLeaderboard(users, meals, NOW);

  it("ranks groups by average weekly diversity", () => {
    expect(lb.ranked.map((r) => [r.group, r.avgDiversity])).toEqual([
      ["Microbiology", 2.7],
      ["Hall A", 2],
      ["Hall B", 2],
    ]);
  });

  it("gives tied averages the same rank; more active members sorts first", () => {
    expect(lb.ranked.map((r) => r.rank)).toEqual([1, 2, 2]);
    expect(lb.ranked[1]).toMatchObject({ group: "Hall A", activeMembers: 3 });
    expect(lb.ranked[2]).toMatchObject({ group: "Hall B", activeMembers: 2, members: 4 });
  });

  it("averages over all members, including those who didn't scan", () => {
    expect(lb.ranked.find((r) => r.group === "Hall B")?.members).toBe(4);
  });

  it("excludes Staple and last week's meals", () => {
    expect(lb.diversityByUser[1]).toBe(3); // Beans, Animal, Soy
    expect(lb.diversityByUser[2]).toBe(2); // Groundnut, Animal
    expect(lb.diversityByUser[6]).toBe(0); // only ate last week
    expect(lb.diversityByUser[7]).toBe(0); // never scanned
  });

  it(`puts groups under ${MIN_MEMBERS} members in "Getting started"`, () => {
    const small = buildLeaderboard([...users, { userId: 11, groupName: "Chess club" }], [...meals, meal(11, ["Soy", "Beans", "Iru", "Egusi"])], NOW);
    expect(small.ranked.map((r) => r.group)).not.toContain("Chess club");
    expect(small.gettingStarted).toEqual([{ group: "Chess club", members: 1, activeMembers: 1, avgDiversity: 4, rank: 0 }]);
  });

  it("matches group names ignoring case and spaces", () => {
    const mixed = buildLeaderboard(
      [{ userId: 1, groupName: "Hall A" }, { userId: 2, groupName: "hall a " }, { userId: 3, groupName: "HALL A" }],
      [],
      NOW,
    );
    expect(mixed.ranked).toHaveLength(1);
    expect(mixed.ranked[0]).toMatchObject({ group: "Hall A", members: 3, avgDiversity: 0 });
  });

  it("resets on Monday, Lagos time", () => {
    const sundayNight = new Date("2026-11-22T22:30:00Z"); // Sun 23:30 Lagos: still this week
    const mondayMorning = new Date("2026-11-22T23:30:00Z"); // Mon 00:30 Lagos: new week
    expect(buildLeaderboard(users, meals, sundayNight).ranked[0].avgDiversity).toBe(2.7);
    expect(buildLeaderboard(users, meals, mondayMorning).ranked.every((r) => r.avgDiversity === 0)).toBe(true);
    expect(buildLeaderboard(users, meals, mondayMorning).weekStart).toBe("2026-11-23");
  });

  it("gives the week start for SQL in UTC", () => {
    expect(weekStartIso(NOW)).toBe("2026-11-15T23:00:00.000Z");
  });

  it("ranks 5,000 users and 50,000 meals in under a second", () => {
    const manyUsers: LbUser[] = Array.from({ length: 5000 }, (_, i) => ({ userId: i, groupName: `Hall ${i % 40}` }));
    const G = ["Beans", "Soy", "Egusi", "Iru", "Animal", "Staple", "Groundnut", "Bambara"];
    const manyMeals: LbMeal[] = Array.from({ length: 50000 }, (_, i) => meal(i % 5000, [G[i % 8], G[(i * 3) % 8]]));
    const t = performance.now();
    const big = buildLeaderboard(manyUsers, manyMeals, NOW);
    expect(performance.now() - t).toBeLessThan(1000);
    expect(big.ranked).toHaveLength(40);
  });
});

describe("rankMembers (inside one group)", () => {
  const now = new Date("2026-11-20T12:00:00Z"); // Friday; the Lagos week started Mon 16 Nov
  const at = (iso: string) => new Date(iso);
  const members = [
    { userId: 1, nickname: "TolaEats" },
    { userId: 2, nickname: "JollofJudge" },
    { userId: 3, nickname: "Kemi_K" },
    { userId: 4, nickname: "Quiet_Q" },
  ];
  const meals = [
    { userId: 1, createdAt: at("2026-11-17T12:00:00Z"), groups: ["Soy", "Staple"] },
    { userId: 1, createdAt: at("2026-11-18T12:00:00Z"), groups: ["Beans"] },
    { userId: 2, createdAt: at("2026-11-17T12:00:00Z"), groups: ["Soy"] },
    { userId: 2, createdAt: at("2026-11-19T12:00:00Z"), groups: ["Soy"] },
    { userId: 3, createdAt: at("2026-11-19T12:00:00Z"), groups: ["Animal"] },
    { userId: 3, createdAt: at("2026-11-10T12:00:00Z"), groups: ["Soy", "Beans", "Egusi"] }, // last week: doesn't count
  ];

  it("ranks by distinct protein groups this week, then plant meals, and gives everyone a row", () => {
    const rows = rankMembers(members, meals, now);
    expect(rows.map((r) => [r.nickname, r.diversity, r.plantMeals, r.rank])).toEqual([
      ["TolaEats", 2, 2, 1],
      ["JollofJudge", 1, 2, 2],
      ["Kemi_K", 1, 0, 3], // animal protein counts for variety, but isn't a plant meal
      ["Quiet_Q", 0, 0, 4],
    ]);
  });

  it("lets members with the same score share a rank", () => {
    const rows = rankMembers(
      [{ userId: 1, nickname: "A" }, { userId: 2, nickname: "B" }],
      [
        { userId: 1, createdAt: at("2026-11-17T12:00:00Z"), groups: ["Soy"] },
        { userId: 2, createdAt: at("2026-11-17T12:00:00Z"), groups: ["Beans"] },
      ],
      now,
    );
    expect(rows.map((r) => r.rank)).toEqual([1, 1]);
  });
});
