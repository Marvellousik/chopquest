import { connection } from "next/server";
import { getCafeteria, listPlantDishes } from "@/lib/server/cafeterias";

// GET /api/cafeterias/:slug/plant-dishes -> { cafeteria, dishes: PlantDish[] }
export async function GET(_req: Request, ctx: RouteContext<"/api/cafeterias/[slug]/plant-dishes">) {
  await connection();
  const { slug } = await ctx.params;
  try {
    const cafeteria = await getCafeteria(slug);
    if (!cafeteria) return Response.json({ error: "Cafeteria not found." }, { status: 404 });
    return Response.json({ cafeteria, dishes: await listPlantDishes(cafeteria.id) });
  } catch (e) {
    console.error("plant dishes failed", e);
    return Response.json({ error: "Couldn't load dishes." }, { status: 500 });
  }
}
