import { getMenuItem } from "@/lib/server/cafeterias";
import { addRequest, recentRequestsByDevice } from "@/lib/server/requests";
import { REQUESTS_PER_DEVICE_PER_HOUR, validateRequest } from "@/lib/requests";

// POST /api/menu-items/:id/requests { deviceId } -> { count, added }
// A student asks for a plant-based version of this dish. Once per device; repeat taps are no-ops.
export async function POST(req: Request, ctx: RouteContext<"/api/menu-items/[id]/requests">) {
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id <= 0) return Response.json({ error: "Bad id." }, { status: 400 });
  const v = validateRequest(await req.json().catch(() => null));
  if (!v.ok) return Response.json({ error: v.error }, { status: 400 });
  try {
    if (!(await getMenuItem(id))) return Response.json({ error: "Dish not found." }, { status: 404 });
    if ((await recentRequestsByDevice(v.deviceId)) >= REQUESTS_PER_DEVICE_PER_HOUR)
      return Response.json({ error: "That's a lot of requests. Try again in an hour." }, { status: 429 });
    return Response.json(await addRequest(id, v.deviceId));
  } catch (e) {
    console.error("plant request failed", e);
    return Response.json({ error: "Couldn't save that. Try again." }, { status: 500 });
  }
}
