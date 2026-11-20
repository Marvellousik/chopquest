-- Every row created by the demo seed is recorded here, so it can be deleted in one go
-- (POST /api/admin/demo {"action":"clear"}) and excluded from evidence numbers.
CREATE TABLE IF NOT EXISTS demo_records (
  table_name  TEXT NOT NULL,
  row_key     TEXT NOT NULL,              -- the row's id, or "cafeteria_id:food_id" for cafeteria_prices
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (table_name, row_key)
);
