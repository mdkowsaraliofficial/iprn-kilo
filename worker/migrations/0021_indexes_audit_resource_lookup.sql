-- 0021_indexes_audit_resource_lookup.sql
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_agent ON audit_logs(user_agent);
CREATE INDEX IF NOT EXISTS idx_system_logs_message ON system_logs(message COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_sse_events_user_type ON sse_events(user_id, event_type);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_active ON api_keys(user_id, last_used_at DESC);
