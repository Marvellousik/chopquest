-- ChopQuest schema for Neon Postgres
-- Run once in the Neon SQL editor, then import data/protein_db.csv into `foods`.

CREATE TABLE foods (
  id                 SERIAL PRIMARY KEY,
  food               TEXT NOT NULL,
  local_name         TEXT,
  dex_group          TEXT NOT NULL,          -- Beans, Soy, Bambara, Groundnut, Egusi, Iru, Mushroom, Tigernut, Pigeon pea, Staple, Animal
  type               TEXT NOT NULL,          -- Plant | Alternative | Staple | Animal
  protein_g_per_100g NUMERIC(5,1) NOT NULL,
  basis              TEXT,                   -- Dry seed, Cooked, Raw, ...
  amino_note         TEXT,
  pet_trait          TEXT,                   -- NULL for staples
  price_ngn_per_kg   NUMERIC(10,2),          -- NULL until the market survey fills it
  source             TEXT                    -- FAO | Approx
);

CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  nickname    TEXT NOT NULL UNIQUE,          -- no login for the hackathon: nickname + group
  group_name  TEXT NOT NULL,                 -- hall / department / friend group for the leaderboard
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE scans (
  id                 SERIAL PRIMARY KEY,
  user_id            INT REFERENCES users(id),
  dish_name          TEXT,
  total_protein_g    NUMERIC(6,1),
  is_complete_pair   BOOLEAN DEFAULT FALSE,  -- grain + legume (or soy / animal) present
  diversity_count    INT,                    -- distinct protein dex_groups in this meal
  created_at         TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE scan_items (
  id              SERIAL PRIMARY KEY,
  scan_id         INT REFERENCES scans(id) ON DELETE CASCADE,
  food_id         INT REFERENCES foods(id),  -- NULL if unmatched
  raw_label       TEXT,                      -- what the vision model said
  estimated_grams NUMERIC(6,1),
  protein_g       NUMERIC(6,1),
  corrected       BOOLEAN DEFAULT FALSE      -- user fixed it with one tap (our training data)
);

CREATE TABLE swaps (
  id           SERIAL PRIMARY KEY,
  scan_id      INT REFERENCES scans(id) ON DELETE CASCADE,
  user_id      INT REFERENCES users(id),
  food_id      INT REFERENCES foods(id),     -- suggested protein
  protein_gain NUMERIC(6,1),
  cost_ngn     NUMERIC(10,2),
  status       TEXT DEFAULT 'suggested',     -- suggested | accepted | skipped
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE quests (
  id          SERIAL PRIMARY KEY,
  user_id     INT REFERENCES users(id),
  swap_id     INT REFERENCES swaps(id),
  title       TEXT NOT NULL,                 -- "Add soy chunks to your stew twice this week"
  dex_group   TEXT,
  target      INT DEFAULT 2,
  progress    INT DEFAULT 0,
  done        BOOLEAN DEFAULT FALSE,
  week_start  DATE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Dex progress per user = discovery + mastery (meals eaten per protein group)
CREATE TABLE dex_progress (
  user_id     INT REFERENCES users(id),
  dex_group   TEXT NOT NULL,
  first_seen  TIMESTAMPTZ DEFAULT now(),
  meal_count  INT DEFAULT 1,                 -- Bronze 3, Silver 10, Gold 25
  PRIMARY KEY (user_id, dex_group)
);

-- Gemini result cache by image hash (free-tier protection). Never stores the photo.
CREATE TABLE IF NOT EXISTS scan_cache (
  image_hash  TEXT PRIMARY KEY,
  result      JSONB NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);
