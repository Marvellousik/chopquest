import { getMenuItem } from "@/lib/server/cafeterias";
import { requireKitchen } from "@/lib/server/kitchen-auth";
import { foodsForCafeteria, getProfile } from "@/lib/server/kitchen";
import { findSwaps } from "@/lib/swap";
import { DEFAULT_LIMITS, type SwapLimits } from "@/lib/types";

function cleanLimits(raw: unknown): SwapLimits | null {
  const b = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const max = b.maxCostPerPlateNgn == null || b.maxCostPerPlateNgn === "" ? null : Number(b.maxCostPerPlateNgn);
  const minPct = b.minProteinKeptPct == null ? DEFAULT_LIMITS.minProteinKeptPct : Number(b.minProteinKeptPct);
  const prep = b.maxExtraPrepMin == null ? DEFAULT_LIMITS.maxExtraPrepMin : Number(b.maxExtraPrepMin);
  if (max !== null && (!Number.isFinite(max) || max < 0 || max > 100000)) return null;
  if (!Number.isFinite(minPct) || minPct < 0 || minPct > 200) return null;
  if (!Number.isFinite(prep) || prep < 0 || prep > 240) return null;
  return {
    maxCostPerPlateNgn: max,
    minProteinKeptPct: minPct,
    keepDishIdentity: b.keepDishIdentity === undefined ? DEFAULT_LIMITS.keepDishIdentity : b.keepDishIdentity === true,
    maxExtraPrepMin: prep,
  };
}

// POST /api/menu-items/:id/swaps  body: SwapLimits (any field optional) -> { options: SwapOption[], limits }
export async function POST(req: Request, ctx: RouteContext<"/api/menu-items/[id]/swaps">) {
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id <= 0) return Response.json({ error: "Bad id." }, { status: 400 });
  const limits = cleanLimits(await req.json().catch(() => ({})));
  if (!limits) return Response.json({ error: "Check the limits and try again." }, { status: 400 });
  try {
    const item = await getMenuItem(id);
    if (!item) return Response.json({ error: "Dish not found." }, { status: 404 });
    const kitchen = await requireKitchen(item.cafeteriaId);
    if (kitchen instanceof Response) return kitchen;
    if (!item.breakdown?.length)
      return Response.json({ error: "Break the dish down first.", code: "no_breakdown" }, { status: 409 });
    // Uses this kitchen's own prices and leaves out foods it can't get; limits come from the request.
    const profile = await getProfile(item.cafeteriaId);
    const foods = await foodsForCafeteria(item.cafeteriaId, profile.excludedFoodIds);
    const options = findSwaps(item.breakdown, item.name, limits, foods);
    return Response.json({ options, limits });
  } catch (e) {
    console.error("swaps failed", e);
    return Response.json({ error: "Couldn't work out swaps. Try again." }, { status: 500 });
  }
}
