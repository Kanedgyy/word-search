-- Create unique index on session_id to prevent duplicate match history entries

CREATE UNIQUE INDEX IF NOT EXISTS "match_history_session_id_unique" ON "match_history" ("session_id");
