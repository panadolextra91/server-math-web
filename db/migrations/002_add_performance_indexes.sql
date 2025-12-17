-- Performance optimization indexes
-- These indexes improve query performance for common operations

-- Composite index for session history queries (ORDER BY created_at)
CREATE INDEX idx_answer_logs_session_created 
ON answer_logs(session_id, created_at DESC);

-- Index for inactive session cleanup (WHERE finished_at IS NULL AND started_at < ...)
CREATE INDEX idx_sessions_finished_started 
ON sessions(finished_at, started_at);

-- Composite index for aggregation queries (session stats)
CREATE INDEX idx_answer_logs_session_stats 
ON answer_logs(session_id, is_correct, score_delta);

-- Index for leaderboard queries (JOIN sessions on player_name, filter by created_at)
-- Note: This helps with the leaderboard time-windowed queries
CREATE INDEX idx_answer_logs_created_session 
ON answer_logs(created_at, session_id);

-- Index for player stats queries (JOIN sessions WHERE player_name)
-- This helps when filtering answer_logs by player_name via sessions
CREATE INDEX idx_sessions_player_finished 
ON sessions(player_name, finished_at);

