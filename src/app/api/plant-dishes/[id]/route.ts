import { connection } from "next/server";
import { getPlantDish, listReviews } from "@/lib/server/cafeterias";

// GET /api/plant-dishes/:id -> { dish: PlantDish & { option, card }, reviews: Review[] }
export async function GET(_req: Request, ctx: RouteContext<"/api/plant-dishes/[id]">) {
  await connection();
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id <= 0) return Response.json({ error: "Bad id." }, { status: 400 });
  try {
    const dish = await getPlantDish(id);
    if (!dish) return Response.json({ error: "Dish not found." }, { status: 404 });
    return Response.json({ dish, reviews: await listReviews(id) });
  } catch (e) {
    console.error("plant dish failed", e);
    return Response.json({ error: "Couldn't load this dish." }, { status: 500 });
  }
}
