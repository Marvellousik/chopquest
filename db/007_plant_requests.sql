-- Students asking for a plant-based version of a menu dish: the demand signal for kitchens.
-- One request per dish per device (random id in localStorage). Structured, no free text.
CREATE TABLE IF NOT EXISTS plant_requests (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  menu_item_id  INTEGER NOT NULL REFERENCES menu_items(id),
  device_id     TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (menu_item_id, device_id)
);

CREATE INDEX IF NOT EXISTS plant_requests_item ON plant_requests (menu_item_id, created_at);
