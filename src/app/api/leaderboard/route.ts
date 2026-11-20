import { connection } from "next/server";
import { query } from "@/lib/db";
import { buildLeaderboard, weekStartIso } from "@/lib/leaderboard";

// GET /api/leaderboard[?user_id=7]
//   -> { weekStart, ranked: GroupRow[], gettingStarted: GroupRow[], me?: { group, diversity } }
// Groups ranked by their members' average weekly diversity (distinct protein groups this
// Lagos week, Staple excluded). Resets Monday 00:00 Lagos time. Ranking logic: src/lib/leaderboard.ts.
export async function GET(req: Request) {
  await connection(); // always run at request time, never prerender at build
  const now = new Date();
  try {
    const [users, rows] = await Promise.all([
      query<{ id: number; group_name: string }>(`SELECT id, group_name FROM users`),
      // Only this week's protein items; one row per item is enough to count distinct groups.
      query<{ user_id: number; created_at: string; dex_group: string }>(
        `SELECT s.user_id, s.created_at, f.dex_group
         FROM scans s
         JOIN scan_items i ON i.scan_id = s.id
         JOIN foods f ON f.id = i.food_id
         WHERE s.created_at >= ? AND f.dex_group <> 'Staple'`,
        [weekStartIso(now)],
      ),
    ]);

    const lb = buildLeaderboard(
      users.map((u) => ({ userId: Number(u.id), groupName: u.group_name })),
      rows.map((r) => ({ userId: Number(r.user_id), createdAt: r.created_at, groups: [r.dex_group] })),
      now,
    );

    const userId = Number(new URL(req.url).searchParams.get("user_id"));
    const meRow = Number.isInteger(userId) ? users.find((u) => Number(u.id) === userId) : undefined;
    const me = meRow ? { group: meRow.group_name, diversity: lb.diversityByUser[userId] ?? 0 } : undefined;

    return Response.json({ weekStart: lb.weekStart, ranked: lb.ranked, gettingStarted: lb.gettingStarted, me });
  } catch (e) {
    console.error("leaderboard failed", e);
    return Response.json({ error: "Couldn't load the leaderboard. Try again in a minute." }, { status: 500 });
  }
}
