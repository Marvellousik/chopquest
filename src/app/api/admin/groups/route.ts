import { connection } from "next/server";
import { getDb, placeholders, query } from "@/lib/db";
import { isAdmin } from "@/lib/server/admin-auth";

// Team-only: remove whole leaderboard groups (e.g. test sign-ups) and everything their members logged.
// Sample-data users are never touched here (use /api/admin/demo for those).
//   GET  /api/admin/groups?name=Senate&name=Hostel%20d     -> preview: members and row counts, deletes nothing
//   POST /api/admin/groups { "groups": ["Senate"], "confirm": true } -> deletes those members, their scans, swaps, quests, Dex
const notFound = () => Response.json({ error: "Not found." }, { status: 404 });

async function membersOf(groups: string[]) {
  return query<{ id: number; nickname: string; group_name: string; created_at: string }>(
    `SELECT id, nickname, group_name, created_at FROM users
     WHERE group_name COLLATE NOCASE IN (${placeholders(groups.length)})
       AND CAST(id AS TEXT) NOT IN (SELECT row_key FROM demo_records WHERE table_name = 'users')
     ORDER BY group_name, id`,
    groups,
  );
}

async function counts(ids: number[]) {
  if (!ids.length) return { scans: 0, swaps: 0, quests: 0, dex_progress: 0 };
  const inIds = placeholders(ids.length);
  const n = async (t: string) => (await query<{ n: number }>(`SELECT COUNT(*) AS n FROM ${t} WHERE user_id IN (${inIds})`, ids))[0].n;
  return { scans: await n("scans"), swaps: await n("swaps"), quests: await n("quests"), dex_progress: await n("dex_progress") };
}

const cleanGroups = (v: unknown) =>
  (Array.isArray(v) ? v : []).filter((g): g is string => typeof g === "string" && g.trim() !== "").map((g) => g.trim()).slice(0, 20);

export async function GET(req: Request) {
  await connection();
  if (!isAdmin(req)) return notFound();
  const groups = cleanGroups(new URL(req.url).searchParams.getAll("name"));
  if (!groups.length) return Response.json({ error: "Give at least one ?name=" }, { status: 400 });
  const members = await membersOf(groups);
  return Response.json({ groups, members, rows: await counts(members.map((m) => m.id)) });
}

export async function POST(req: Request) {
  if (!isAdmin(req)) return notFound();
  const body = (await req.json().catch(() => null)) as { groups?: unknown; confirm?: unknown } | null;
  const groups = cleanGroups(body?.groups);
  if (!groups.length || body?.confirm !== true) {
    return Response.json({ error: 'Send { "groups": [...], "confirm": true }. Preview first with GET.' }, { status: 400 });
  }
  const members = await membersOf(groups);
  const ids = members.map((m) => m.id);
  const removed = await counts(ids);
  if (ids.length) {
    const inIds = placeholders(ids.length);
    await getDb().batch(
      [
        { sql: `DELETE FROM scan_items WHERE scan_id IN (SELECT id FROM scans WHERE user_id IN (${inIds}))`, args: ids },
        { sql: `DELETE FROM swaps WHERE user_id IN (${inIds}) OR scan_id IN (SELECT id FROM scans WHERE user_id IN (${inIds}))`, args: [...ids, ...ids] },
        { sql: `DELETE FROM scans WHERE user_id IN (${inIds})`, args: ids },
        { sql: `DELETE FROM quests WHERE user_id IN (${inIds})`, args: ids },
        { sql: `DELETE FROM dex_progress WHERE user_id IN (${inIds})`, args: ids },
        { sql: `DELETE FROM users WHERE id IN (${inIds})`, args: ids },
      ],
      "write",
    );
  }
  return Response.json({ groups, removed: { users: ids.length, ...removed }, members: members.map((m) => m.nickname) });
}
