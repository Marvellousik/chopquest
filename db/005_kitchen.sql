-- Kitchen admin (plan v2): manager access, kitchen setup survey, own prices, where to buy proteins.
-- Only new tables (no ALTER), so this file is safe to re-run on every boot.

-- One row per cafeteria: access code + what the manager told us in the setup survey.
CREATE TABLE IF NOT EXISTS kitchen_profiles (
  cafeteria_id        INTEGER PRIMARY KEY REFERENCES cafeterias(id),
  access_code_hash    TEXT,                      -- scrypt "salt:hash" of the 6-digit code; NULL = no access yet
  open_days_per_week  INTEGER,
  plates_per_day      INTEGER,
  goal                TEXT,                      -- 'more_margin' | 'lower_price' | 'balance'
  switch_rate_pct     REAL NOT NULL DEFAULT 25,  -- assumed share of a dish's buyers who pick the plant version
  max_extra_prep_min  INTEGER NOT NULL DEFAULT 15,
  excluded_food_ids   TEXT NOT NULL DEFAULT '[]', -- JSON array of foods.id the kitchen can't get or won't use
  updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Per-dish numbers only the manager knows.
CREATE TABLE IF NOT EXISTS menu_item_stats (
  menu_item_id        INTEGER PRIMARY KEY REFERENCES menu_items(id) ON DELETE CASCADE,
  plates_per_week     INTEGER,
  cost_per_plate_ngn  REAL,                      -- what one plate costs to make, if the manager knows it
  manager_confirmed   INTEGER NOT NULL DEFAULT 0, -- 1 once the manager checked the dish's parts and numbers
  updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- What this cafeteria really pays for a food. Overrides the market-survey price for its own reports.
CREATE TABLE IF NOT EXISTS cafeteria_prices (
  cafeteria_id      INTEGER NOT NULL REFERENCES cafeterias(id),
  food_id           INTEGER NOT NULL REFERENCES foods(id),
  price_ngn_per_kg  REAL NOT NULL,
  unit              TEXT,
  unit_price_ngn    REAL,
  unit_weight_g     REAL,
  supplier          TEXT,
  updated_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (cafeteria_id, food_id)
);

-- Where to buy each alternative protein, on campus and in Bwari. Loaded from data/protein_sources.csv.
CREATE TABLE IF NOT EXISTS protein_sources (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  food_id          INTEGER NOT NULL REFERENCES foods(id),
  area             TEXT NOT NULL,               -- 'On campus' | 'Bwari town' | ...
  place_type       TEXT,                        -- market stall | shop | vendor | kitchen
  place_name       TEXT NOT NULL,
  landmark         TEXT,
  what_to_ask_for  TEXT,
  unit             TEXT,
  price_ngn        REAL,
  unit_weight_g    REAL,
  contact          TEXT,
  how_to_buy       TEXT,
  status           TEXT NOT NULL DEFAULT 'likely', -- 'confirmed' (team checked it) | 'likely' (check first)
  source           TEXT,
  last_checked     TEXT,
  UNIQUE (food_id, area, place_name)
);

-- Manager sign-in: one row per signed-in device. Only a hash of the cookie token is stored.
CREATE TABLE IF NOT EXISTS kitchen_sessions (
  token_hash    TEXT PRIMARY KEY,
  cafeteria_id  INTEGER NOT NULL REFERENCES cafeterias(id),
  expires_at    TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Failed code attempts, to slow down guessing (10 per cafeteria per 15 minutes).
CREATE TABLE IF NOT EXISTS kitchen_login_failures (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  cafeteria_id  INTEGER NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS protein_sources_food ON protein_sources (food_id, status);
CREATE INDEX IF NOT EXISTS kitchen_login_failures_cafe ON kitchen_login_failures (cafeteria_id, created_at);
