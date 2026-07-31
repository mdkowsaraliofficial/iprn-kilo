-- 0020_additional_unique_constraints.sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_numbers_e164_unique ON numbers(e164);
CREATE UNIQUE INDEX IF NOT EXISTS idx_otp_sms_unique ON otps(sms_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reward_rule_level_target ON reward_rules(level, target) WHERE active = 1;
CREATE UNIQUE INDEX IF NOT EXISTS idx_countries_code_unique ON countries(code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_providers_slug_unique ON providers(slug);
