import { query } from "@/lib/db";
import { aiJson } from "@/lib/ai/client";
import { buildCompanion, type CompanionScan } from "@/lib/companion";
import { pickDishes, ruleReply, type ChatReply } from "@/lib/companion-reply";
import { campusDishes } from "@/lib/server/campus-dishes";

export const maxDuration = 30;

type Msg = { role: "user" | "pet"; text: string };

const SYSTEM = (name: string) => `You are ${name}, a friendly bean-shaped companion in ChopQuest, a Nigerian campus food app.
You live on the student's phone and grow when they eat a VARIETY of protein, especially plant protein (beans, soy, groundnut, egusi, bambara, iru, tigernut, pigeon pea, mushroom).
Speak in warm, simple Nigerian English, like a cheerful friend. 1 to 3 short sentences, under 60 words, because your reply is read aloud.
Rules:
- Recommend only from the campus dishes and missing groups you are given. Never invent dishes, prices or ratings.
- Never shame meat or animal protein. Never tell them to eat more food, never mention calories or weight.
- Protein numbers are estimates. You are not a doctor: for health conditions, say to ask a health worker.
- No emoji.
Return JSON: {"reply": string, "dishIds": number[]} where dishIds are 0 to 2 ids from the campus dishes you mention.`;

// POST /api/companion/chat { userId, petName, messages: [{ role, text }] } -> ChatReply
// The AI answers from real facts (what the student ate, real campus dishes). If the AI is not
// available (no key, no credits, rate limit), the rule-based reply answers instead.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { userId?: unknown; petName?: unknown; messages?: unknown } | null;
  const userId = Number(body?.userId);
  const petName = typeof body?.petName === "string" && body.petName.trim() ? body.petName.trim().slice(0, 20) : "Ewa";
  const messages = (Array.isArray(body?.messages) ? body.messages : [])
    .filter((m): m is Msg => !!m && typeof (m as Msg).text === "string" && ((m as Msg).role === "user" || (m as Msg).role === "pet"))
    .slice(-8)
    .map((m) => ({ role: m.role, text: m.text.slice(0, 400) }));
  if (!Number.isInteger(userId) || userId <= 0) return Response.json({ error: "Sign up first so I know who you are." }, { status: 400 });

  try {
    const rows = await query<{ scan_id: number; created_at: string; dex_group: string; type: string; food: string; local_name: string | null }>(
      `SELECT s.id AS scan_id, s.created_at, f.dex_group, f.type, f.food, f.local_name
       FROM scans s JOIN scan_items i ON i.scan_id = s.id JOIN foods f ON f.id = i.food_id WHERE s.user_id = ?`,
      [userId],
    );
    const byScan = new Map<number, CompanionScan>();
    for (const r of rows) {
      const s = byScan.get(r.scan_id) ?? { id: r.scan_id, createdAt: r.created_at, foods: [] };
      s.foods.push({ dex_group: r.dex_group, type: r.type, food: r.food, local_name: r.local_name });
      byScan.set(r.scan_id, s);
    }
    const c = buildCompanion([...byScan.values()]);
    const dishes = await campusDishes();
    const shortlist = pickDishes(c, dishes, 6);

    const facts = {
      thisWeekGroups: c.thisWeek,
      missingThisWeek: c.missingThisWeek.slice(0, 4),
      mood: c.mood,
      stage: c.stage,
      mealsScanned: c.scans,
      campusDishes: shortlist.map((d) => ({ id: d.id, name: d.name, cafeteria: d.cafeteria, priceNgn: d.priceNgn, rating: d.avgRating, adds: d.groups })),
    };
    const convo = messages.map((m) => `${m.role === "user" ? "Student" : petName}: ${m.text}`).join("\n") || "Student: Hi!";

    try {
      const { json } = await aiJson({ system: SYSTEM(petName), text: `Facts (JSON): ${JSON.stringify(facts)}\n\nConversation:\n${convo}\n\nReply as ${petName}.`, maxTokens: 400, temperature: 0.6 });
      const j = json as { reply?: unknown; dishIds?: unknown };
      const reply = typeof j.reply === "string" ? j.reply.trim().slice(0, 500) : "";
      if (!reply) throw new Error("empty");
      const allowed = new Set(shortlist.map((d) => d.id));
      const dishIds = (Array.isArray(j.dishIds) ? j.dishIds : []).map(Number).filter((id) => allowed.has(id)).slice(0, 2);
      return Response.json({ reply, dishIds, source: "ai", dishes: dishIds.map((id) => shortlist.find((d) => d.id === id)).filter(Boolean) } satisfies ChatReply & { dishes: unknown });
    } catch (e) {
      console.warn("companion chat: AI unavailable, using rules", (e as Error).message);
      const r = ruleReply(c, dishes, petName);
      return Response.json({ ...r, dishes: r.dishIds.map((id) => dishes.find((d) => d.id === id)).filter(Boolean) });
    }
  } catch (e) {
    console.error("companion chat failed", e);
    return Response.json({ error: "I couldn't hear you properly. Try again." }, { status: 500 });
  }
}
