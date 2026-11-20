// Leaderboard (task 8a): groups ranked by the average weekly diversity of their members.
// Pure: no DB, no network. The API route loads rows and calls buildLeaderboard().
// Diversity = distinct protein groups this Lagos week (Mon–Sun), Staple excluded: the same
// weeklyDiversity() that drives pet mood. Grams, calories and price never count.

import { lagosWeekStart, lagosWeekStartDate, weeklyDiversity } from "@/lib/rewards";

/** Groups with fewer members than this go in "Getting started", unranked. */
export const MIN_MEMBERS = 3;

export type LbUser = { userId: number; groupName: string };
export type LbMeal = { userId: number; createdAt: string | Date; groups: (string | null | undefined)[] };

export type GroupRow = {
  group: string;
  members: number;
  /** Members who scanned at least one protein this week. */
  activeMembers: number;
  /** Average weekly diversity over ALL members, 1 decimal. */
  avgDiversity: number;
  /** 1-based; groups with the same average share a rank. 0 for "Getting started". */
  rank: number;
};

export type Leaderboard = {
  weekStart: string; // 'YYYY-MM-DD', the Lagos Monday
  ranked: GroupRow[];
  gettingStarted: GroupRow[];
  /** Weekly diversity per user, for "your score". */
  diversityByUser: Record<number, number>;
};

const round1 = (n: number) => Math.round(n * 10) / 10;

export function buildLeaderboard(users: LbUser[], meals: LbMeal[], now: Date = new Date()): Leaderboard {
  const mealsByUser = new Map<number, LbMeal[]>();
  for (const m of meals) {
    const list = mealsByUser.get(m.userId);
    if (list) list.push(m);
    else mealsByUser.set(m.userId, [m]);
  }

  const diversityByUser: Record<number, number> = {};
  // Group names are matched ignoring case and outer spaces (onboarding does the same).
  const groups = new Map<string, { name: string; scores: number[] }>();
  for (const u of users) {
    const d = weeklyDiversity(mealsByUser.get(u.userId) ?? [], now);
    diversityByUser[u.userId] = d;
    const key = u.groupName.trim().toLowerCase();
    if (!key) continue;
    const g = groups.get(key) ?? { name: u.groupName.trim(), scores: [] };
    g.scores.push(d);
    groups.set(key, g);
  }

  const rows: GroupRow[] = [...groups.values()].map(({ name, scores }) => ({
    group: name,
    members: scores.length,
    activeMembers: scores.filter((s) => s > 0).length,
    avgDiversity: round1(scores.reduce((a, b) => a + b, 0) / scores.length),
    rank: 0,
  }));

  const byScore = (a: GroupRow, b: GroupRow) =>
    b.avgDiversity - a.avgDiversity || b.activeMembers - a.activeMembers || b.members - a.members || a.group.localeCompare(b.group);

  const ranked = rows.filter((r) => r.members >= MIN_MEMBERS).sort(byScore);
  ranked.forEach((r, i) => {
    r.rank = i > 0 && r.avgDiversity === ranked[i - 1].avgDiversity ? ranked[i - 1].rank : i + 1;
  });
  const gettingStarted = rows.filter((r) => r.members < MIN_MEMBERS).sort(byScore);

  return { weekStart: lagosWeekStartDate(now), ranked, gettingStarted, diversityByUser };
}

/** ISO instant the current Lagos week began, for the SQL WHERE created_at >= ? filter. */
export const weekStartIso = (now: Date = new Date()) => lagosWeekStart(now).toISOString();

// ---- Inside one group: each member's own ranking ----

export type LbMember = { userId: number; nickname: string };

export type MemberRow = {
  userId: number;
  nickname: string;
  /** Distinct protein groups this Lagos week (Staple excluded), same score as the group board. */
  diversity: number;
  /** Meals this week with at least one plant or alternative protein (tie-breaker). */
  plantMeals: number;
  /** 1-based; members with the same diversity and plant meals share a rank. */
  rank: number;
};

const NOT_PLANT = new Set(["Animal", "Staple"]);

/** Rank the members of one group against each other for the current Lagos week. */
export function rankMembers(members: LbMember[], meals: LbMeal[], now: Date = new Date()): MemberRow[] {
  const start = lagosWeekStart(now).getTime();
  const end = start + 7 * 24 * 60 * 60 * 1000;
  const rows: MemberRow[] = members.map((m) => {
    const mine = meals.filter((x) => x.userId === m.userId);
    const thisWeek = mine.filter((x) => {
      const t = new Date(x.createdAt).getTime();
      return t >= start && t < end;
    });
    return {
      userId: m.userId,
      nickname: m.nickname,
      diversity: weeklyDiversity(mine, now),
      plantMeals: thisWeek.filter((x) => x.groups.some((g) => g && !NOT_PLANT.has(g))).length,
      rank: 0,
    };
  });
  rows.sort((a, b) => b.diversity - a.diversity || b.plantMeals - a.plantMeals || a.nickname.localeCompare(b.nickname));
  rows.forEach((r, i) => {
    const prev = rows[i - 1];
    r.rank = prev && prev.diversity === r.diversity && prev.plantMeals === r.plantMeals ? prev.rank : i + 1;
  });
  return rows;
}
