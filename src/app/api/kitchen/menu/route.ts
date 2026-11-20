import { connection } from "next/server";
import { requireKitchen } from "@/lib/server/kitchen-auth";
import { listKitchenMenu, saveMenuItem } from "@/lib/server/kitchen";

const numOrNull = (v: unknown, max: number) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= max ? n : undefined;
};

// GET  /api/kitchen/menu -> { items: KitchenMenuItem[] }   (this kitchen's dishes with the manager's numbers)
// POST /api/kitchen/menu { id?, name, priceNgn, isTopSeller, platesPerWeek, costPerPlateNgn, confirmed } -> { id }
export async function GET() {
  await connection();
  const s = await requireKitchen();
  if (s instanceof Response) return s;
  return Response.json({ items: await listKitchenMenu(s.cafeteria.id) });
}

export async function POST(req: Request) {
  const s = await requireKitchen();
  if (s instanceof Response) return s;
  const b = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name.trim().replace(/\s+/g, " ").slice(0, 80) : "";
  const price = Number(b.priceNgn);
  const plates = numOrNull(b.platesPerWeek, 100000);
  const cost = numOrNull(b.costPerPlateNgn, 100000);
  const id = b.id === undefined || b.id === null ? undefined : Number(b.id);
  if (name.length < 2) return Response.json({ error: "Give the dish a name." }, { status: 400 });
  if (!Number.isFinite(price) || price <= 0 || price > 100000) return Response.json({ error: "Enter the price students pay, in naira." }, { status: 400 });
  if (plates === undefined) return Response.json({ error: "Plates per week must be a number." }, { status: 400 });
  if (cost === undefined) return Response.json({ error: "Cost per plate must be a number in naira." }, { status: 400 });
  if (id !== undefined && (!Number.isInteger(id) || id <= 0)) return Response.json({ error: "Bad dish id." }, { status: 400 });
  try {
    const saved = await saveMenuItem(s.cafeteria.id, {
      id, name, priceNgn: Math.round(price), isTopSeller: b.isTopSeller === true,
      platesPerWeek: plates === null ? null : Math.round(plates), costPerPlateNgn: cost === null ? null : Math.round(cost), confirmed: b.confirmed === true,
    });
    if (saved === null) return Response.json({ error: "That dish belongs to another cafeteria.", code: "kitchen_forbidden" }, { status: 403 });
    return Response.json({ id: saved }, { status: id ? 200 : 201 });
  } catch (e) {
    console.error("save menu item failed", e);
    return Response.json({ error: "Couldn't save the dish. Try again." }, { status: 500 });
  }
}
