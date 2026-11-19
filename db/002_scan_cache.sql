-- Step 2: cache Gemini results by image hash so the same photo never spends free-tier quota twice.
-- Run once in the Neon SQL editor (also included at the bottom of schema.sql for fresh databases).
CREATE TABLE IF NOT EXISTS scan_cache (
  image_hash  TEXT PRIMARY KEY,              -- sha256 of the resized JPEG
  result      JSONB NOT NULL,                -- parsed Gemini JSON (no photo is stored)
  created_at  TIMESTAMPTZ DEFAULT now()
);
