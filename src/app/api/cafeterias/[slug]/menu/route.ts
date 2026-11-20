import { connection } from "next/server";
import { getCafeteria, listMenu } from "@/lib/server/cafeterias";
import { listFoods } from "@/lib/foods-db";
import { convertibility } from "@/lib/swap";

// GET /api/cafeterias/:slug/menu -> { cafeteria, items: MenuItem[] } (top sellers first, with convertibility)
export async function GET(_req: Request, ctx: RouteContext<"/api/cafeterias/[slug]/menu">) {
  await connection();
  const { slug } = await ctx.params;
  try {
    const cafeteria = await getCafeteria(slug);
    if (!cafeteria) return Response.json({ error: "Cafeteria not found." }, { status: 404 });
    const [items, foods] = await Promise.all([listMenu(cafeteria.id), listFoods()]);
    return Response.json({
      cafeteria,
      items: items.map((i) => ({ ...i, convertibility: convertibility(i.breakdown, i.name, foods) })),
    });
  } catch (e) {
    console.error("menu failed", e);
    return Response.json({ error: "Couldn't load the menu." }, { status: 500 });
  }
}
