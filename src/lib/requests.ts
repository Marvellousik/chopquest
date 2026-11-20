// "I'd try a plant version" requests from students: the demand signal kitchens see.
// Plain functions, testable without a DB.

export const REQUESTS_PER_DEVICE_PER_HOUR = 20;

export function validateRequest(body: unknown): { ok: true; deviceId: string } | { ok: false; error: string } {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const deviceId = typeof b.deviceId === "string" ? b.deviceId.trim() : "";
  if (!/^[A-Za-z0-9-]{8,64}$/.test(deviceId)) return { ok: false, error: "Missing device id." };
  return { ok: true, deviceId };
}

/** Kitchen wording for a request count. */
export function demandLabel(n: number): string | null {
  if (n <= 0) return null;
  return n === 1 ? "1 student wants a plant version" : `${n} students want a plant version`;
}
