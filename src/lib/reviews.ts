// Review input validation for the public board. Plain function: used by the API and testable.
import { clean } from "./user";

export const COMMENT_MAX = 280;
export const REVIEWS_PER_DEVICE_PER_HOUR = 10;

export type ReviewInput = {
  nickname: string;
  stars: 1 | 2 | 3 | 4 | 5;
  wouldOrderAgain: boolean;
  comment: string | null;
  deviceId: string;
};

export function validateReview(body: unknown): { ok: true; value: ReviewInput } | { ok: false; error: string } {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const nickname = clean(b.nickname);
  if (nickname.length < 2 || nickname.length > 20) return { ok: false, error: "Nickname must be 2 to 20 characters." };
  const stars = Number(b.stars);
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) return { ok: false, error: "Pick 1 to 5 stars." };
  if (typeof b.wouldOrderAgain !== "boolean") return { ok: false, error: "Tell us if you'd order it again." };
  const comment = typeof b.comment === "string" ? b.comment.trim() : "";
  if (comment.length > COMMENT_MAX) return { ok: false, error: `Keep your comment under ${COMMENT_MAX} characters.` };
  const deviceId = typeof b.deviceId === "string" ? b.deviceId.trim() : "";
  if (!/^[A-Za-z0-9-]{8,64}$/.test(deviceId)) return { ok: false, error: "Missing device id." };
  return {
    ok: true,
    value: { nickname, stars: stars as ReviewInput["stars"], wouldOrderAgain: b.wouldOrderAgain, comment: comment || null, deviceId },
  };
}
