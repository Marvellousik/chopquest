import { isUniqueViolation } from "@/lib/db";
import { REVIEWS_PER_DEVICE_PER_HOUR, validateReview } from "@/lib/reviews";
import { createReview, getPlantDish, recentReviewsByDevice } from "@/lib/server/cafeterias";

// POST /api/plant-dishes/:id/reviews { nickname, stars, wouldOrderAgain, comment?, deviceId } -> { review }
export async function POST(req: Request, ctx: RouteContext<"/api/plant-dishes/[id]/reviews">) {
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id <= 0) return Response.json({ error: "Bad id." }, { status: 400 });
  const v = validateReview(await req.json().catch(() => null));
  if (!v.ok) return Response.json({ error: v.error }, { status: 400 });
  try {
    if (!(await getPlantDish(id))) return Response.json({ error: "Dish not found." }, { status: 404 });
    if ((await recentReviewsByDevice(v.value.deviceId)) >= REVIEWS_PER_DEVICE_PER_HOUR)
      return Response.json({ error: "That's a lot of reviews. Try again in an hour." }, { status: 429 });
    const review = await createReview(id, v.value);
    return Response.json({ review }, { status: 201 });
  } catch (e) {
    if (isUniqueViolation(e)) return Response.json({ error: "You've already reviewed this dish." }, { status: 409 });
    console.error("review failed", e);
    return Response.json({ error: "Couldn't save your review. Try again." }, { status: 500 });
  }
}
