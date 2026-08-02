-- 0022_indexes_sms_body_search.sql
CREATE INDEX IF NOT EXISTS idx_sms_body_search ON sms_messages(sender, body);
CREATE INDEX IF NOT EXISTS idx_sms_user_status ON sms_messages(user_id, status);
CREATE INDEX IF NOT EXISTS idx_numbers_country_operator ON numbers(country_code, operator);
CREATE INDEX IF NOT EXISTS idx_reward_events_rule_status ON reward_events(rule_id, status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_created ON withdrawal_requests(user_id, created_at DESC);
