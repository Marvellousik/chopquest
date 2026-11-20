import { timingSafeEqual } from "node:crypto";

// Team-only admin routes: header "x-admin-token" must equal the ADMIN_TOKEN server variable.
// Callers answer 404 when this is false, so the routes don't advertise themselves.
export function isAdmin(req: Request): boolean {
  const expected = process.env.ADMIN_TOKEN;
  const got = req.headers.get("x-admin-token") ?? "";
  if (!expected || expected.length < 16) return false;
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
