import { connection } from "next/server";
import { query } from "@/lib/db";
import { buildLeaderboard, rankMembers, weekStartIso } from "@/lib/leaderboard";

// GET /api/leaderboard/group?name=Jollof%20Mafia[&user_id=7]
//   -> { group, weekStart, members: MemberRow[], groupRank, groupCount, avgDiversity, meId? }
// One group's own leaderboard: its members ranked against each other this Lagos week.
export async function GET(req: Request) {
  await connection();
  const url = new URL(req.url);
  const name = (url.searchParams.get("name") ?? "").trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 40) return Response.json({ error: "Pick a group." }, { status: 400 });
  const userId = Number(url.searchParams.get("user_id"));
  const now = new Date();
  try {
    const [members, allUsers, rows] = await Promise.all([
      query<{ id: number; nickname: string; group_name: string }>("SELECT id, nickname, group_name FROM users WHERE group_name = ? COLLATE NOCASE", [name]),
      query<{ id: number; group_name: string }>("SELECT id, group_name FROM users"),
      query<{ user_id: number; scan_id: number; created_at: string; dex_group: string }>(
        `SELECT s.user_id, s.id AS scan_id, s.created_at, f.dex_group
         FROM scans s JOIN scan_items i ON i.scan_id = s.id JOIN foods f ON f.id = i.food_id
         WHERE s.created_at >= ?`,
        [weekStartIso(now)],
      ),
    ]);
    if (!members.length) return Response.json({ error: "That group doesn't exist yet." }, { status: 404 });

    // One meal per scan, with all its protein groups.
    const meals = new Map<number, { userId: number; createdAt: string; groups: string[] }>();
    for (const r of rows) {
      const m = meals.get(r.scan_id) ?? { userId: Number(r.user_id), createdAt: r.created_at, groups: [] };
      m.groups.push(r.dex_group);
      meals.set(r.scan_id, m);
    }
    const mealList = [...meals.values()];
    const ranked = rankMembers(members.map((m) => ({ userId: Number(m.id), nickname: m.nickname })), mealList, now);
    const board = buildLeaderboard(allUsers.map((u) => ({ userId: Number(u.id), groupName: u.group_name })), mealList, now);
    const row = [...board.ranked, ...board.gettingStarted].find((g) => g.group.toLowerCase() === name.toLowerCase());

    return Response.json({
      group: members[0].group_name,
      weekStart: board.weekStart,
      members: ranked,
      groupRank: row?.rank ?? 0,
      groupCount: board.ranked.length,
      avgDiversity: row?.avgDiversity ?? 0,
      meId: Number.isInteger(userId) && ranked.some((r) => r.userId === userId) ? userId : undefined,
    });
  } catch (e) {
    console.error("group leaderboard failed", e);
    return Response.json({ error: "Couldn't load this group. Try again in a minute." }, { status: 500 });
  }
}
