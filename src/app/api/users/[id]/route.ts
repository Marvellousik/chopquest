import { getSql } from "@/lib/db";
import type { User } from "@/lib/user";

// GET /api/users/:id -> { user } | 404. Used to confirm a saved user_id still exists.
export async function GET(_req: Request, ctx: RouteContext<"/api/users/[id]">) {
  const { id } = await ctx.params;
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) return Response.json({ error: "Bad id." }, { status: 400 });
  try {
    const rows = (await getSql()`SELECT id, nickname, group_name FROM users WHERE id = ${n}`) as User[];
    if (!rows.length) return Response.json({ error: "Not found." }, { status: 404 });
    return Response.json({ user: rows[0] });
  } catch (e) {
    console.error("get user failed", e);
    return Response.json({ error: "Server error." }, { status: 500 });
  }
}
