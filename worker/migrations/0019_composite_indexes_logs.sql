-- 0019_composite_indexes_logs.sql
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_time ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_time ON audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_time ON audit_logs(resource_type, resource_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_time ON system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_category_time ON system_logs(category, created_at DESC);
