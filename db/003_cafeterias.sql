-- Challenge 2: campus cafeterias, their menus, published plant dishes and student reviews.
-- Applied by `npm run db:setup` after schema.sql. Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS cafeterias (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  slug      TEXT NOT NULL UNIQUE,              -- ase-cafe, bush-cafe, munchbox, first-cafe, second-cafe
  name      TEXT NOT NULL,
  location  TEXT
);

CREATE TABLE IF NOT EXISTS menu_items (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  cafeteria_id   INTEGER NOT NULL REFERENCES cafeterias(id),
  name           TEXT NOT NULL,
  price_ngn      REAL NOT NULL,
  is_top_seller  INTEGER NOT NULL DEFAULT 0,
  breakdown      TEXT,                          -- JSON DishPart[] from the AI breakdown
  UNIQUE (cafeteria_id, name)
);

CREATE TABLE IF NOT EXISTS plant_dishes (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  cafeteria_id  INTEGER NOT NULL REFERENCES cafeterias(id),
  menu_item_id  INTEGER NOT NULL REFERENCES menu_items(id),
  name          TEXT NOT NULL,
  price_ngn     REAL NOT NULL,
  protein_g     REAL NOT NULL,
  option        TEXT NOT NULL,                  -- JSON SwapOption
  card          TEXT NOT NULL,                  -- JSON KitchenCard
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS reviews (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  plant_dish_id      INTEGER NOT NULL REFERENCES plant_dishes(id),
  device_id          TEXT NOT NULL,             -- random id in localStorage: one review per dish per device
  nickname           TEXT NOT NULL,
  stars              INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
  would_order_again  INTEGER NOT NULL,
  comment            TEXT,
  created_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (plant_dish_id, device_id)
);

CREATE INDEX IF NOT EXISTS menu_items_cafeteria ON menu_items (cafeteria_id);
CREATE INDEX IF NOT EXISTS plant_dishes_cafeteria ON plant_dishes (cafeteria_id);
CREATE INDEX IF NOT EXISTS reviews_dish ON reviews (plant_dish_id, created_at);
CREATE INDEX IF NOT EXISTS reviews_device ON reviews (device_id, created_at);
