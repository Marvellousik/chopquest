import { getSql } from "@/lib/db";
import { clean, validate, type User } from "@/lib/user";

// POST /api/users  { nickname, group } -> { user }
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const nickname = clean(body.nickname);
  const group = clean(body.group);
  const invalid = validate(nickname, group);
  if (invalid) return Response.json({ error: invalid }, { status: 400 });

  try {
    const sql = getSql();
    // Nicknames are unique case-insensitively so "Tunde" and "tunde" can't both exist.
    const taken = await sql`SELECT 1 FROM users WHERE lower(nickname) = lower(${nickname}) LIMIT 1`;
    if (taken.length) {
      return Response.json({ error: "That nickname is taken. Try another." }, { status: 409 });
    }
    // Snap to an existing group's spelling ("hall a" joins "Hall A") so the leaderboard isn't split.
    const existing = (await sql`
      SELECT group_name FROM users WHERE lower(group_name) = lower(${group}) LIMIT 1
    `) as { group_name: string }[];
    const groupName = existing[0]?.group_name ?? group;
    const rows = (await sql`
      INSERT INTO users (nickname, group_name)
      VALUES (${nickname}, ${groupName})
      RETURNING id, nickname, group_name
    `) as User[];
    return Response.json({ user: rows[0] }, { status: 201 });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "23505") {
      return Response.json({ error: "That nickname is taken. Try another." }, { status: 409 });
    }
    console.error("create user failed", e);
    return Response.json({ error: "Couldn't create your profile. Try again." }, { status: 500 });
  }
}
