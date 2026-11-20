import { getDb, placeholders, query } from "@/lib/db";

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
    const user = await query("SELECT 1 FROM users WHERE id = ?", [userId]);
    if (!user.length) return Response.json({ error: "Profile not found. Please sign up again." }, { status: 404 });

    const ids = [...new Set(items.map((i) => i.food_id).filter((x): x is number => x !== null))];
    const foods = ids.length
      ? await query<{ id: number; p: number }>(
          `SELECT id, protein_g_per_100g AS p FROM foods WHERE id IN (${placeholders(ids.length)})`,
          ids,
        )
      : [];
    const per100 = new Map(foods.map((f) => [f.id, f.p]));

    const rows = items.map((i) => {
      const p = i.food_id !== null ? per100.get(i.food_id) : undefined;
      return {
        ...i,
        food_id: p === undefined ? null : i.food_id, // drop ids that don't exist
        protein_g: p === undefined ? null : Math.round(((i.grams * p) / 100) * 10) / 10,
      };
    });
    const total = Math.round(rows.reduce((s, r) => s + (r.protein_g ?? 0), 0) * 10) / 10;

    // Scan + items in one write transaction, so a meal is never saved half-way.
    const tx = await getDb().transaction("write");
    let scanId: number;
    try {
      const s = await tx.execute({
        sql: "INSERT INTO scans (user_id, dish_name, total_protein_g) VALUES (?, ?, ?) RETURNING id",
        args: [userId, dishName, total],
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
