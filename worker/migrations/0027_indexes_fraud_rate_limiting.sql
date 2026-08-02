-- 0027_indexes_fraud_rate_limiting.sql
CREATE INDEX IF NOT EXISTS idx_api_usage_ip ON api_usage_logs(ip);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip ON audit_logs(ip);
CREATE INDEX IF NOT EXISTS idx_system_settings_category_key ON system_settings(category, key);
CREATE INDEX IF NOT EXISTS idx_orders_user_type ON orders(user_id, type);
CREATE INDEX IF NOT EXISTS idx_provider_health_time_status ON provider_health_log(checked_at DESC, status);
