import { connection } from "next/server";
import { getCafeteria } from "@/lib/server/cafeterias";
import { requestCounts } from "@/lib/server/requests";

// GET /api/cafeterias/:slug/requests -> { counts: { [menuItemId]: number }, total }
export async function GET(_req: Request, ctx: RouteContext<"/api/cafeterias/[slug]/requests">) {
  await connection();
  try {
    const cafeteria = await getCafeteria((await ctx.params).slug);
    if (!cafeteria) return Response.json({ error: "Cafeteria not found." }, { status: 404 });
    const counts = await requestCounts(cafeteria.id);
    return Response.json({ counts, total: Object.values(counts).reduce((a, b) => a + b, 0) });
  } catch (e) {
    console.error("request counts failed", e);
    return Response.json({ error: "Couldn't load requests." }, { status: 500 });
  }
}
