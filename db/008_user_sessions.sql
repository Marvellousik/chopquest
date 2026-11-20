-- Student sign-in that survives reloads, cleared site data and Safari's 7-day storage limit.
-- An httpOnly cookie holds a random token; only its hash is stored. Sessions slide: each visit
-- pushes the expiry back to 90 days.
CREATE TABLE IF NOT EXISTS user_sessions (
  token_hash  TEXT PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id),
  expires_at  TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Accounts that already have a session. A device that signed up before sessions existed can
-- attach itself once (nickname + id it saved); after that only the cookie signs in.
CREATE TABLE IF NOT EXISTS user_bound (
  user_id     INTEGER PRIMARY KEY REFERENCES users(id),
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS user_sessions_user ON user_sessions (user_id);
