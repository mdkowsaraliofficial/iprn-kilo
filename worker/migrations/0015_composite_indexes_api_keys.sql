-- 0015_composite_indexes_api_keys.sql
CREATE INDEX IF NOT EXISTS idx_api_keys_user_created ON api_keys(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_key_time ON api_usage_logs(api_key_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_time ON api_usage_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_status_time ON api_usage_logs(status_code, created_at DESC);
