-- 0007_indexes_system_analytics_logs.sql
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_updated_at ON system_settings(updated_at);

CREATE INDEX IF NOT EXISTS idx_sse_events_user ON sse_events(user_id);
CREATE INDEX IF NOT EXISTS idx_sse_events_type ON sse_events(event_type);
CREATE INDEX IF NOT EXISTS idx_sse_events_created_at ON sse_events(created_at);

CREATE INDEX IF NOT EXISTS idx_analytics_hour_bucket ON analytics_hour(bucket_hour);
CREATE INDEX IF NOT EXISTS idx_analytics_hour_country ON analytics_hour(country_code);
CREATE INDEX IF NOT EXISTS idx_analytics_hour_day_bucket ON analytics_hour(bucket_hour DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_day_bucket ON analytics_day(bucket_day);
CREATE INDEX IF NOT EXISTS idx_analytics_day_country ON analytics_day(country_code);
CREATE INDEX IF NOT EXISTS idx_analytics_day_day_bucket ON analytics_day(bucket_day DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_category ON system_logs(category);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
