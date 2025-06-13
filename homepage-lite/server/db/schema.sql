-- Core schema for sbit-dash

-- Table for caching results from external APIs or expensive computations
CREATE TABLE IF NOT EXISTS cache (
  key TEXT PRIMARY KEY,        -- Unique identifier for the cache entry
  json TEXT NOT NULL,          -- JSON string containing the cached data
  expires_at INTEGER           -- Unix timestamp (seconds) when the cache entry expires
);

CREATE INDEX IF NOT EXISTS idx_cache_expires_at ON cache(expires_at);

-- Table to track applied database migrations (hashes of schema files)
-- This helps in ensuring that schema changes are applied consistently.
CREATE TABLE IF NOT EXISTS migrations (
  hash TEXT PRIMARY KEY,       -- SHA-256 hash of the migration content (schema.sql + widget model.sql files)
  applied_at INTEGER DEFAULT (strftime('%s','now')) -- Unix timestamp when the migration was applied
);

-- Optional: Store pragma user_version, can be updated by migrate.js
-- PRAGMA user_version = 1; -- Example: Set initial version
