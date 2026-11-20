import { connection } from "next/server";
import { query } from "@/lib/db";

// GET /api/groups -> { groups: string[] } — existing groups, so people join the same
// hall/department spelling instead of creating "Hall A" and "hall a".
export async function GET() {
  await connection(); // always run at request time, never prerender at build
  try {
    const rows = await query<{ group_name: string }>(`
      SELECT group_name, count(*) AS members
      FROM users GROUP BY group_name ORDER BY members DESC, group_name LIMIT 50
    `);
    return Response.json({ groups: rows.map((r) => r.group_name) });
  } catch (e) {
    console.error("list groups failed", e);
    return Response.json({ groups: [] });
  }
}
