import { connection } from "next/server";
import { requireKitchen } from "@/lib/server/kitchen-auth";
import { GOALS, getProfile, saveProfile, type Goal, type KitchenProfile } from "@/lib/server/kitchen";
import { SWITCH_RATE_EXPLAINER } from "@/lib/kitchen-copy";

const intOrNull = (v: unknown, max: number) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 && n <= max ? n : undefined;
};

// GET /api/kitchen/profile -> { profile, switchRateExplainer }
// PUT /api/kitchen/profile { openDaysPerWeek, platesPerDay, goal, switchRatePct, maxExtraPrepMin, excludedFoodIds } -> { profile }
export async function GET() {
  await connection();
  const s = await requireKitchen();
  if (s instanceof Response) return s;
  return Response.json({ profile: await getProfile(s.cafeteria.id), switchRateExplainer: SWITCH_RATE_EXPLAINER });
}

export async function PUT(req: Request) {
  const s = await requireKitchen();
  if (s instanceof Response) return s;
  const b = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  const current = await getProfile(s.cafeteria.id);
  const openDays = b.openDaysPerWeek === undefined ? current.openDaysPerWeek : intOrNull(b.openDaysPerWeek, 7);
  const platesPerDay = b.platesPerDay === undefined ? current.platesPerDay : intOrNull(b.platesPerDay, 100000);
  const prep = b.maxExtraPrepMin === undefined ? current.maxExtraPrepMin : intOrNull(b.maxExtraPrepMin, 240);
  const rate = b.switchRatePct === undefined ? current.switchRatePct : Number(b.switchRatePct);
  const goal = b.goal === undefined ? current.goal : b.goal === null ? null : GOALS.includes(b.goal as Goal) ? (b.goal as Goal) : undefined;
  const excluded = b.excludedFoodIds === undefined ? current.excludedFoodIds : Array.isArray(b.excludedFoodIds) ? b.excludedFoodIds.map(Number) : undefined;
  if (openDays === undefined) return Response.json({ error: "Opening days must be 0 to 7." }, { status: 400 });
  if (platesPerDay === undefined) return Response.json({ error: "Plates per day must be a whole number." }, { status: 400 });
  if (prep === undefined || prep === null) return Response.json({ error: "Extra prep time must be 0 to 240 minutes." }, { status: 400 });
  if (!Number.isFinite(rate) || rate < 1 || rate > 100) return Response.json({ error: "Switch rate must be between 1% and 100%." }, { status: 400 });
  if (goal === undefined) return Response.json({ error: "Pick a goal." }, { status: 400 });
  if (excluded === undefined || excluded.some((n) => !Number.isInteger(n) || n <= 0) || excluded.length > 60)
    return Response.json({ error: "Check the foods you can't use." }, { status: 400 });
  const profile: KitchenProfile = { openDaysPerWeek: openDays, platesPerDay, goal, switchRatePct: Math.round(rate * 10) / 10, maxExtraPrepMin: prep, excludedFoodIds: [...new Set(excluded)] };
  try {
    await saveProfile(s.cafeteria.id, profile);
    return Response.json({ profile });
  } catch (e) {
    console.error("save profile failed", e);
    return Response.json({ error: "Couldn't save. Try again." }, { status: 500 });
  }
}
