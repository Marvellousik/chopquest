import { getMenuItem, saveBreakdown } from "@/lib/server/cafeterias";
import type { DishPart } from "@/lib/types";

export const maxDuration = 60;

const ROLES = new Set(["protein", "staple", "soup", "side"]);

function cleanParts(raw: unknown): DishPart[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 12) return null;
  const parts: DishPart[] = [];
  for (const p of raw as Record<string, unknown>[]) {
    const grams = Number(p?.grams);
    const foodId = p?.foodId == null ? null : Number(p.foodId);
    if (typeof p?.label !== "string" || !p.label.trim() || !Number.isFinite(grams) || grams <= 0 || grams > 2000) return null;
    if (foodId !== null && (!Number.isInteger(foodId) || foodId <= 0)) return null;
    if (!ROLES.has(String(p.role))) return null;
    parts.push({ foodId, label: p.label.trim().slice(0, 60), grams: Math.round(grams), role: p.role as DishPart["role"] });
  }
  return parts;
}

// POST /api/menu-items/:id/breakdown
//   {}                      -> the saved breakdown, or runs the AI breakdown (Pascal) and saves it
//   { parts: DishPart[] }   -> saves the manager's corrected breakdown
// -> { breakdown: DishPart[] }
export async function POST(req: Request, ctx: RouteContext<"/api/menu-items/[id]/breakdown">) {
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id <= 0) return Response.json({ error: "Bad id." }, { status: 400 });
  const body = (await req.json().catch(() => ({}))) as { parts?: unknown };
  try {
    const item = await getMenuItem(id);
    if (!item) return Response.json({ error: "Dish not found." }, { status: 404 });

    if (body.parts !== undefined) {
      const parts = cleanParts(body.parts);
      if (!parts) return Response.json({ error: "Check the parts: each needs a name, grams and a role." }, { status: 400 });
      await saveBreakdown(id, parts);
      return Response.json({ breakdown: parts });
    }
    if (item.breakdown?.length) return Response.json({ breakdown: item.breakdown });

    // STUB: owner Pascal (team/pascal-ai.md, breakdownDish). Until it lands, the manager enters parts by hand.
    return Response.json(
      { error: "The AI breakdown isn't connected yet. Add the parts by hand for now.", code: "ai_not_ready" },
      { status: 503 },
    );
  } catch (e) {
    console.error("breakdown failed", e);
    return Response.json({ error: "Couldn't break down this dish. Try again." }, { status: 500 });
  }
}
