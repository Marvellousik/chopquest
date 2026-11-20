// Plant-version requests (server only).
import { query } from "@/lib/db";

/** Adds a request once per dish per device. Returns the dish's new total. */
export async function addRequest(menuItemId: number, deviceId: string): Promise<{ count: number; added: boolean }> {
  const ins = await query<{ id: number }>(
    "INSERT INTO plant_requests (menu_item_id, device_id) VALUES (?, ?) ON CONFLICT (menu_item_id, device_id) DO NOTHING RETURNING id",
    [menuItemId, deviceId],
  );
  const rows = await query<{ n: number }>("SELECT COUNT(*) AS n FROM plant_requests WHERE menu_item_id = ?", [menuItemId]);
  return { count: Number(rows[0]?.n ?? 0), added: ins.length > 0 };
}

export async function recentRequestsByDevice(deviceId: string): Promise<number> {
  const rows = await query<{ n: number }>(
    "SELECT COUNT(*) AS n FROM plant_requests WHERE device_id = ? AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 hour')",
    [deviceId],
  );
  return Number(rows[0]?.n ?? 0);
}

/** Request counts per menu item for one cafeteria. */
export async function requestCounts(cafeteriaId: number): Promise<Record<number, number>> {
  const rows = await query<{ menu_item_id: number; n: number }>(
    `SELECT r.menu_item_id, COUNT(*) AS n FROM plant_requests r JOIN menu_items m ON m.id = r.menu_item_id
     WHERE m.cafeteria_id = ? GROUP BY r.menu_item_id`,
    [cafeteriaId],
  );
  return Object.fromEntries(rows.map((r) => [Number(r.menu_item_id), Number(r.n)]));
}
