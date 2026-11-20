// Manager access codes: 6 digits, stored only as "scrypt$<saltHex>$<hashHex>".
// The same format is written by scripts/kitchen-codes.mts (keep N/r/p/length in sync).
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const PARAMS = { N: 16384, r: 8, p: 1 } as const;
const KEYLEN = 32;

export const isCodeShape = (code: unknown): code is string => typeof code === "string" && /^\d{6}$/.test(code);

export function hashCode(code: string): string {
  const salt = randomBytes(16);
  return `scrypt$${salt.toString("hex")}$${scryptSync(code, salt, KEYLEN, PARAMS).toString("hex")}`;
}

/** Constant-time check of a code against a stored hash. Any malformed hash fails closed. */
export function verifyCode(code: string, stored: string | null | undefined): boolean {
  if (!isCodeShape(code) || !stored) return false;
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  if (expected.length !== KEYLEN) return false;
  const actual = scryptSync(code, Buffer.from(saltHex, "hex"), KEYLEN, PARAMS);
  return timingSafeEqual(actual, expected);
}
