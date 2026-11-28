-- Cap Bar assistant: short-lived relay queue between the website and the isolated assistant seat.
-- Questions and answers are deleted after 1 hour. No IP addresses are stored (only salted daily hashes in rate keys).
CREATE TABLE IF NOT EXISTS assistant_jobs (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  question TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  claimed_at INTEGER,
  answered_at INTEGER,
  answer TEXT,
  citations TEXT,
  kind TEXT
);
CREATE INDEX IF NOT EXISTS idx_assistant_jobs_status ON assistant_jobs(status, created_at);
CREATE TABLE IF NOT EXISTS assistant_rate (k TEXT PRIMARY KEY, n INTEGER NOT NULL, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS assistant_nonce (nonce TEXT PRIMARY KEY, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS assistant_seat (id INTEGER PRIMARY KEY, last_seen INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS assistant_daily (
  day TEXT PRIMARY KEY,
  asked INTEGER NOT NULL DEFAULT 0,
  answered INTEGER NOT NULL DEFAULT 0,
  no_answer INTEGER NOT NULL DEFAULT 0,
  refused INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  rate_limited INTEGER NOT NULL DEFAULT 0,
  blocked INTEGER NOT NULL DEFAULT 0
);
