-- 0003_indexes_sms_rewards.sql
CREATE INDEX IF NOT EXISTS idx_sms_number ON sms_messages(number_id);
CREATE INDEX IF NOT EXISTS idx_sms_user ON sms_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_country ON sms_messages(country);
CREATE INDEX IF NOT EXISTS idx_sms_operator ON sms_messages(operator);
CREATE INDEX IF NOT EXISTS idx_sms_provider ON sms_messages(provider_id);
CREATE INDEX IF NOT EXISTS idx_sms_status ON sms_messages(status);
CREATE INDEX IF NOT EXISTS idx_sms_created_at ON sms_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_sms_sender ON sms_messages(sender);
CREATE INDEX IF NOT EXISTS idx_sms_otp ON sms_messages(extracted_otp) WHERE extracted_otp IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_otps_sms ON otps(sms_id);
CREATE INDEX IF NOT EXISTS idx_otps_user ON otps(user_id);
CREATE INDEX IF NOT EXISTS idx_otps_code ON otps(code);
CREATE INDEX IF NOT EXISTS idx_otps_extracted_at ON otps(extracted_at);

CREATE INDEX IF NOT EXISTS idx_reward_rules_level ON reward_rules(level);
CREATE INDEX IF NOT EXISTS idx_reward_rules_target ON reward_rules(target);
CREATE INDEX IF NOT EXISTS idx_reward_rules_active ON reward_rules(active);
CREATE INDEX IF NOT EXISTS idx_reward_rules_priority ON reward_rules(priority DESC);
CREATE INDEX IF NOT EXISTS idx_reward_rules_level_priority ON reward_rules(level, priority DESC);

CREATE INDEX IF NOT EXISTS idx_reward_events_sms ON reward_events(sms_id);
CREATE INDEX IF NOT EXISTS idx_reward_events_user ON reward_events(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_events_rule ON reward_events(rule_id);
CREATE INDEX IF NOT EXISTS idx_reward_events_status ON reward_events(status);
CREATE INDEX IF NOT EXISTS idx_reward_events_created_at ON reward_events(created_at);
