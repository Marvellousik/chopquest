import type { VisionItem, VisionResult } from "./foods";

export const VISION_PROMPT = `You are a Nigerian food recognition assistant. Look at the photo of a meal and identify every visible food.
Use Nigerian dish names where they apply (jollof rice, ewa agoyin, moi moi, akara, okpa, efo riro, egusi soup, beans porridge, dodo, garri, eba, amala, pounded yam, suya, awara, Indomie, kuli-kuli).
For each food, estimate the portion in household units (spoons, wraps, pieces, cups).
If you are unsure, give your best guess and set confidence below 0.6.
Return ONLY valid JSON in this exact shape:
{"dish_name": "string", "items": [{"food": "string", "local_name": "string", "portion": "string", "estimated_grams": number, "cooking_method": "boiled|fried|steamed|stewed|raw|roasted", "confidence": number}]}`;

export type GeminiErrorKind = "rate_limit" | "config" | "unreadable" | "upstream";

export class GeminiError extends Error {
  kind: GeminiErrorKind;
  constructor(kind: GeminiErrorKind, message: string) {
    super(message);
    this.kind = kind;
  }
}

const METHODS = new Set(["boiled", "fried", "steamed", "stewed", "raw", "roasted"]);
const str = (v: unknown, max = 80) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const clamp = (v: unknown, lo: number, hi: number, dflt: number) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt;
};

/** Never trust model JSON: coerce it into the shape the app expects, dropping junk items. */
export function sanitizeVision(raw: unknown): VisionResult {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const items: VisionItem[] = (Array.isArray(o.items) ? o.items : [])
    .slice(0, 12)
    .map((it): VisionItem | null => {
      const i = (it && typeof it === "object" ? it : {}) as Record<string, unknown>;
      const food = str(i.food);
      if (!food) return null;
      const method = str(i.cooking_method, 20).toLowerCase();
      return {
        food,
        local_name: str(i.local_name),
        portion: str(i.portion),
        estimated_grams: Math.round(clamp(i.estimated_grams, 0, 2000, 100)),
        cooking_method: METHODS.has(method) ? method : "",
        confidence: Math.round(clamp(i.confidence, 0, 1, 0.5) * 100) / 100,
      };
    })
    .filter((x): x is VisionItem => x !== null);
  return { dish_name: str(o.dish_name, 100) || "Your meal", items };
}

export async function analyzeMeal(base64Jpeg: string): Promise<VisionResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new GeminiError("config", "GEMINI_API_KEY is not set");
  const model = process.env.GEMINI_MODEL || "gemini-flash-latest";

  let res: Response;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: VISION_PROMPT }, { inline_data: { mime_type: "image/jpeg", data: base64Jpeg } }] },
        ],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
      }),
      signal: AbortSignal.timeout(45_000),
    });
  } catch (e) {
    throw new GeminiError("upstream", `Gemini request failed: ${(e as Error).message}`);
  }

  if (res.status === 429) throw new GeminiError("rate_limit", "Gemini free-tier limit reached");
  if (res.status === 400 || res.status === 401 || res.status === 403 || res.status === 404) {
    const body = await res.text().catch(() => "");
    // 400 is also returned for a bad image; only treat key/model problems as config errors.
    if (res.status !== 400 || /api key|API_KEY|permission/i.test(body))
      throw new GeminiError("config", `Gemini ${res.status}: ${body.slice(0, 300)}`);
    throw new GeminiError("unreadable", `Gemini 400: ${body.slice(0, 300)}`);
  }
  if (!res.ok) throw new GeminiError("upstream", `Gemini ${res.status}`);

  const data = await res.json();
  const parts: { text?: string; thought?: boolean }[] = data?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.filter((p) => !p.thought && p.text).map((p) => p.text).join("");
  if (!text) throw new GeminiError("unreadable", `No content (finishReason: ${data?.candidates?.[0]?.finishReason ?? data?.promptFeedback?.blockReason})`);

  let parsed: unknown;
  try {
    parsed = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ""));
  } catch {
    throw new GeminiError("unreadable", "Gemini returned invalid JSON");
  }
  return sanitizeVision(parsed);
}
