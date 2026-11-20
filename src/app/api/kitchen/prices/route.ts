import { connection } from "next/server";
import { requireKitchen } from "@/lib/server/kitchen-auth";
import { listOwnPrices, saveOwnPrice } from "@/lib/server/kitchen";
import { listFoods } from "@/lib/foods-db";

// GET /api/kitchen/prices -> { prices: OwnPrice[] }   (what this kitchen pays; overrides market prices in its reports)
// PUT /api/kitchen/prices { foodId, unit, unitPriceNgn, unitWeightG, supplier } -> { priceNgnPerKg }
export async function GET() {
  await connection();
  const s = await requireKitchen();
  if (s instanceof Response) return s;
  return Response.json({ prices: await listOwnPrices(s.cafeteria.id) });
}

export async function PUT(req: Request) {
  const s = await requireKitchen();
  if (s instanceof Response) return s;
  const b = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  const foodId = Number(b.foodId);
  const unitPrice = Number(b.unitPriceNgn);
  const unitWeight = Number(b.unitWeightG);
  const unit = typeof b.unit === "string" ? b.unit.trim().slice(0, 40) || null : null;
  const supplier = typeof b.supplier === "string" ? b.supplier.trim().slice(0, 80) || null : null;
  if (!Number.isInteger(foodId) || foodId <= 0) return Response.json({ error: "Pick a food." }, { status: 400 });
  if (!Number.isFinite(unitPrice) || unitPrice <= 0 || unitPrice > 1000000) return Response.json({ error: "Enter what you pay for one unit, in naira." }, { status: 400 });
  if (!Number.isFinite(unitWeight) || unitWeight <= 0 || unitWeight > 100000) return Response.json({ error: "Enter how many grams one unit weighs." }, { status: 400 });
  try {
    if (!(await listFoods()).some((f) => f.id === foodId)) return Response.json({ error: "Unknown food." }, { status: 400 });
    const perKg = await saveOwnPrice(s.cafeteria.id, { foodId, unit, unitPriceNgn: unitPrice, unitWeightG: unitWeight, supplier });
    return Response.json({ priceNgnPerKg: perKg });
  } catch (e) {
    console.error("save price failed", e);
    return Response.json({ error: "Couldn't save the price. Try again." }, { status: 500 });
  }
}
