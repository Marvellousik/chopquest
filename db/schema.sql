-- ChopQuest schema for Turso (libSQL / SQLite).
-- Apply with `npm run db:setup` (safe to re-run: every statement is IF NOT EXISTS),
-- then `npm run seed` to load data/protein_db.csv into `foods`.
--
-- SQLite notes: booleans are INTEGER 0/1, timestamps are ISO-8601 UTC TEXT,
-- dates (week_start) are 'YYYY-MM-DD' TEXT, JSON is TEXT.

CREATE TABLE IF NOT EXISTS foods (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  food               TEXT NOT NULL UNIQUE,
  local_name         TEXT,
  dex_group          TEXT NOT NULL,          -- Beans, Soy, Bambara, Groundnut, Egusi, Iru, Mushroom, Tigernut, Pigeon pea, Staple, Animal
  type               TEXT NOT NULL,          -- Plant | Alternative | Staple | Animal
  protein_g_per_100g REAL NOT NULL,
  basis              TEXT,                   -- Dry seed, Cooked, Raw, ...
  amino_note         TEXT,
  pet_trait          TEXT,                   -- NULL for staples
  price_ngn_per_kg   REAL,                   -- NULL until the market survey fills it
  source             TEXT                    -- FAO | Approx
);

CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname    TEXT NOT NULL UNIQUE COLLATE NOCASE, -- no login: nickname + group. "Tunde" = "tunde"
  group_name  TEXT NOT NULL,                       -- hall / department / friend group for the leaderboard
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS scans (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id            INTEGER REFERENCES users(id),
  dish_name          TEXT,
  total_protein_g    REAL,
  is_complete_pair   INTEGER NOT NULL DEFAULT 0, -- grain + legume (or soy / animal) present
  diversity_count    INTEGER,                    -- distinct protein dex_groups in this meal
  created_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS scan_items (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  scan_id         INTEGER REFERENCES scans(id) ON DELETE CASCADE,
  food_id         INTEGER REFERENCES foods(id),  -- NULL if unmatched
  raw_label       TEXT,                          -- what the vision model said
  estimated_grams REAL,
  protein_g       REAL,
  corrected       INTEGER NOT NULL DEFAULT 0     -- user fixed it with one tap (our training data)
);

CREATE TABLE IF NOT EXISTS swaps (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  scan_id      INTEGER REFERENCES scans(id) ON DELETE CASCADE,
  user_id      INTEGER REFERENCES users(id),
  food_id      INTEGER REFERENCES foods(id),     -- suggested protein
  protein_gain REAL,
  cost_ngn     REAL,
  status       TEXT NOT NULL DEFAULT 'suggested', -- suggested | accepted | skipped
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS quests (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER REFERENCES users(id),
  swap_id     INTEGER REFERENCES swaps(id),
  title       TEXT NOT NULL,                     -- "Add soy chunks to your stew twice this week"
  dex_group   TEXT,
  target      INTEGER NOT NULL DEFAULT 2,
  progress    INTEGER NOT NULL DEFAULT 0,
  done        INTEGER NOT NULL DEFAULT 0,
  week_start  TEXT NOT NULL,                     -- 'YYYY-MM-DD', the Monday (Lagos time) the quest belongs to
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Dex progress per user = discovery + mastery (meals eaten per protein group)
CREATE TABLE IF NOT EXISTS dex_progress (
  user_id     INTEGER REFERENCES users(id),
  dex_group   TEXT NOT NULL,
  first_seen  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  meal_count  INTEGER NOT NULL DEFAULT 1,        -- Bronze 3, Silver 10, Gold 25
  PRIMARY KEY (user_id, dex_group)
);

-- Gemini result cache by image hash (free-tier protection). Never stores the photo.
CREATE TABLE IF NOT EXISTS scan_cache (
  image_hash  TEXT PRIMARY KEY,                  -- sha256 of the resized JPEG
  result      TEXT NOT NULL,                     -- parsed Gemini JSON
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS scans_user_created ON scans (user_id, created_at);
CREATE INDEX IF NOT EXISTS scan_items_scan ON scan_items (scan_id);
