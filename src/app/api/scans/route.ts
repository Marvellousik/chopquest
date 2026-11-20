import { getDb, placeholders, query } from "@/lib/db";
import { mealIsComplete } from "@/lib/diet";
import { currentUser } from "@/lib/server/user-session";

type InItem = { raw_label?: unknown; food_id?: unknown; estimated_grams?: unknown; corrected?: unknown };

// POST /api/scans { user_id, dish_name, items: [{ raw_label, food_id, estimated_grams, corrected }] }
//   -> { scan_id, total_protein_g }
// Saves the meal after the user confirmed / fixed the list. protein_g is computed server-side from foods.
export async function POST(req: Request) {
  let body: { user_id?: unknown; dish_name?: unknown; items?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const userId = Number(body.user_id);
  if (!Number.isInteger(userId) || userId <= 0) return Response.json({ error: "Missing user." }, { status: 400 });
  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 20)
    return Response.json({ error: "Add at least one food." }, { status: 400 });

  const items = (body.items as InItem[]).map((i) => {
    const fid = Number(i.food_id);
    const g = Number(i.estimated_grams);
    return {
      raw_label: typeof i.raw_label === "string" && i.raw_label.trim() ? i.raw_label.trim().slice(0, 80) : null,
      food_id: Number.isInteger(fid) && fid > 0 ? fid : null,
      grams: Number.isFinite(g) ? Math.min(2000, Math.max(0, Math.round(g))) : 0,
      corrected: i.corrected === true,
    };
  });
  const dishName = typeof body.dish_name === "string" ? body.dish_name.trim().slice(0, 100) || null : null;

  try {
    // A signed-in device may only save meals to its own account.
    const me = await currentUser();
    if (me && me.id !== userId) return Response.json({ error: "That's not your account on this phone." }, { status: 403 });
    const user = await query("SELECT 1 FROM users WHERE id = ?", [userId]);
    if (!user.length) return Response.json({ error: "Profile not found. Please sign up again." }, { status: 404 });

    const ids = [...new Set(items.map((i) => i.food_id).filter((x): x is number => x !== null))];
    const foods = ids.length
      ? await query<{ id: number; p: number; food: string; grp: string; type: "Plant" | "Alternative" | "Staple" | "Animal" }>(
          `SELECT id, protein_g_per_100g AS p, food, dex_group AS grp, type FROM foods WHERE id IN (${placeholders(ids.length)})`,
          ids,
        )
      : [];
    const per100 = new Map(foods.map((f) => [f.id, f.p]));
    const foodById = new Map(foods.map((f) => [f.id, f]));

    const rows = items.map((i) => {
      const p = i.food_id !== null ? per100.get(i.food_id) : undefined;
      return {
        ...i,
        food_id: p === undefined ? null : i.food_id, // drop ids that don't exist
        protein_g: p === undefined ? null : Math.round(((i.grams * p) / 100) * 10) / 10,
      };
    });
    const total = Math.round(rows.reduce((s, r) => s + (r.protein_g ?? 0), 0) * 10) / 10;
    // Variety and pairing for the leaderboard and inventory (protein groups, Staple excluded).
    const matched = rows.map((r) => (r.food_id == null ? null : foodById.get(r.food_id))).filter((f) => f != null);
    const diversity = new Set(matched.map((f) => f.grp).filter((g) => g !== "Staple")).size;
    const complete = mealIsComplete({
      id: 0, at: "", dish: dishName, total,
      items: matched.map((f) => ({ label: f.food, food: f.food, group: f.grp, type: f.type, grams: 0, protein: null })),
    });

    // Scan + items in one write transaction, so a meal is never saved half-way.
    const tx = await getDb().transaction("write");
    let scanId: number;
    try {
      const s = await tx.execute({
        sql: "INSERT INTO scans (user_id, dish_name, total_protein_g, is_complete_pair, diversity_count) VALUES (?, ?, ?, ?, ?) RETURNING id",
        args: [userId, dishName, total, complete ? 1 : 0, diversity],
      });
      scanId = Number(s.rows[0][0]);
      await tx.batch(
        rows.map((r) => ({
          sql: "INSERT INTO scan_items (scan_id, food_id, raw_label, estimated_grams, protein_g, corrected) VALUES (?, ?, ?, ?, ?, ?)",
          args: [scanId, r.food_id, r.raw_label, r.grams, r.protein_g, r.corrected ? 1 : 0],
        })),
      );
      await tx.commit();
    } finally {
      tx.close();
    }

    return Response.json({ scan_id: scanId, total_protein_g: total }, { status: 201 });
  } catch (e) {
    console.error("save scan failed", e);
    return Response.json({ error: "Couldn't save your meal. Try again." }, { status: 500 });
  }
}
