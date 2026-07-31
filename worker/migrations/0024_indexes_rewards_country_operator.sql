-- 0024_indexes_rewards_country_operator.sql
CREATE INDEX IF NOT EXISTS idx_reward_events_user_date ON reward_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_country_operator ON sms_messages(country, operator);
CREATE INDEX IF NOT EXISTS idx_analytics_hour_country_operator ON analytics_hour(country_code, operator);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity_time ON audit_logs(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created_status ON webhook_deliveries(created_at DESC, status);
