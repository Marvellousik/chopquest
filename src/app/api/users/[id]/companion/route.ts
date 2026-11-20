import { connection } from "next/server";
import { query } from "@/lib/db";
import { buildCompanion, type CompanionScan } from "@/lib/companion";

// GET /api/users/:id/companion -> Companion (points, stage, mood, strength, stats, missing groups)
// Computed from the user's saved scans every time, so it can never drift from the rules.
export async function GET(_req: Request, ctx: RouteContext<"/api/users/[id]/companion">) {
  await connection();
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id <= 0) return Response.json({ error: "Bad user." }, { status: 400 });
  try {
    const rows = await query<{ scan_id: number; created_at: string; dex_group: string; type: string; food: string; local_name: string | null }>(
      `SELECT s.id AS scan_id, s.created_at, f.dex_group, f.type, f.food, f.local_name
       FROM scans s JOIN scan_items i ON i.scan_id = s.id JOIN foods f ON f.id = i.food_id
       WHERE s.user_id = ? ORDER BY s.created_at`,
      [id],
    );
    const byScan = new Map<number, CompanionScan>();
    for (const r of rows) {
      const s = byScan.get(r.scan_id) ?? { id: r.scan_id, createdAt: r.created_at, foods: [] };
      s.foods.push({ dex_group: r.dex_group, type: r.type, food: r.food, local_name: r.local_name });
      byScan.set(r.scan_id, s);
    }
    return Response.json(buildCompanion([...byScan.values()]));
  } catch (e) {
    console.error("companion failed", e);
    return Response.json({ error: "Couldn't wake your companion. Try again." }, { status: 500 });
  }
}
