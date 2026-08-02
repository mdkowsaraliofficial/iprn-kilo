-- 0025_indexes_notifications_read.sql
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(read, created_at DESC) WHERE read = 0;
CREATE INDEX IF NOT EXISTS idx_sse_events_type_time ON sse_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_endpoint ON api_usage_logs(user_id, endpoint, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_operators_country_name ON operators(country_code, name);
