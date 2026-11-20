import { getMenuItem } from "@/lib/server/cafeterias";
import type { KitchenCard, SwapOption } from "@/lib/types";

export const maxDuration = 60;

// STUB: owner Pascal (team/pascal-ai.md, writeKitchenCard). This template card is also the
// fallback when the AI is down, so keep it when the real one lands.
function templateCard(dishName: string, option: SwapOption): KitchenCard {
  const added = option.adds.map((a) => `${a.label} (${a.grams} g)`).join(" and ");
  const removed = option.replaces.map((p) => p.label.toLowerCase()).join(" and ");
  const base = dishName.replace(new RegExp(option.replaces.map((p) => p.label).join("|"), "ig"), "").trim() || dishName;
  return {
    menuName: `Plant ${base}`.replace(/\s+/g, " "),
    studentBlurb: `Our ${base.toLowerCase()} with ${option.adds.map((a) => a.label.toLowerCase()).join(" and ")} instead of ${removed}.`,
    steps: [
      `Prepare ${base.toLowerCase()} exactly as usual, without the ${removed}.`,
      `Prepare ${added} the way your kitchen usually cooks it.`,
      `Serve it in place of the ${removed}, one portion per plate.`,
    ],
    validated: true,
  };
}

// POST /api/swaps/kitchen-card { menuItemId, option } -> { card: KitchenCard }
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { menuItemId?: unknown; option?: SwapOption } | null;
  const id = Number(body?.menuItemId);
  if (!Number.isInteger(id) || id <= 0 || !body?.option?.adds?.length || !Array.isArray(body.option.replaces))
    return Response.json({ error: "Pick a swap first." }, { status: 400 });
  try {
    const item = await getMenuItem(id);
    if (!item) return Response.json({ error: "Dish not found." }, { status: 404 });
    return Response.json({ card: templateCard(item.name, body.option) });
  } catch (e) {
    console.error("kitchen card failed", e);
    return Response.json({ error: "Couldn't write the kitchen card. Try again." }, { status: 500 });
  }
}
