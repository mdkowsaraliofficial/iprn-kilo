-- 0030_seed.sql
INSERT OR IGNORE INTO users (id, email, display_name, status, role, number_limit_override, api_enabled, tier, created_at)
VALUES ('demo-user-001', 'demo@iprn.online', 'Demo User', 'active', 'user', 100, 1, 'bronze', datetime('now'));

INSERT OR IGNORE INTO users (id, email, display_name, status, role, number_limit_override, api_enabled, tier, created_at)
VALUES ('admin-user-001', 'admin@iprn.online', 'Admin', 'active', 'admin', NULL, 1, 'platinum', datetime('now'));

INSERT OR IGNORE INTO wallet_balances (user_id, pending_cents, approved_cents, frozen_cents, lifetime_earned_cents, lifetime_withdrawn_cents, updated_at)
VALUES ('demo-user-001', 0, 5000, 0, 5000, 0, datetime('now'));

INSERT OR IGNORE INTO wallet_balances (user_id, pending_cents, approved_cents, frozen_cents, lifetime_earned_cents, lifetime_withdrawn_cents, updated_at)
VALUES ('admin-user-001', 0, 0, 0, 0, 0, datetime('now'));

INSERT OR IGNORE INTO reward_rules (id, level, target, base_amount_cents, multiplier, priority, active, valid_from, valid_to, notes, created_at, updated_at)
VALUES ('global-default', 'global', NULL, 10, 1.0, 999, 1, NULL, NULL, 'Default global reward rule: 10 cents per SMS', datetime('now'), datetime('now'));

INSERT OR IGNORE INTO reward_rules (id, level, target, base_amount_cents, multiplier, priority, active, valid_from, valid_to, notes, created_at, updated_at)
VALUES ('per-otp-rule', 'per_otp', NULL, 25, 1.0, 900, 1, NULL, NULL, 'Reward for SMS containing an OTP', datetime('now'), datetime('now'));

INSERT OR IGNORE INTO countries (id, code, name, active, base_reward_multiplier)
VALUES ('GB', 'GB', 'United Kingdom', 1, 1.0),
       ('US', 'US', 'United States', 1, 1.0),
       ('DE', 'DE', 'Germany', 1, 1.0),
       ('FR', 'FR', 'France', 1, 1.0),
       ('ES', 'ES', 'Spain', 1, 1.0);

INSERT OR IGNORE INTO operators (id, country_code, name, active, reward_multiplier)
VALUES
  ('GB-EE', 'GB', 'EE (Everything Everywhere)', 1, 1.0),
  ('GB-VM', 'GB', 'Vodafone', 1, 1.0),
  ('GB-O2', 'GB', 'O2', 1, 1.0),
  ('GB-3', 'GB', 'Three', 1, 1.0),
  ('US-TW', 'US', 'T-Mobile', 1, 1.0),
  ('US-AT', 'US', 'AT&T', 1, 1.0),
  ('US-VZ', 'US', 'Verizon', 1, 1.0),
  ('DE-TM', 'DE', 'Telekom', 1, 1.0),
  ('DE-VL', 'DE', 'Vodafone', 1, 1.0),
  ('DE-T', 'DE', 'Telefónica', 1, 1.0),
  ('FR-OR', 'FR', 'Orange', 1, 1.0),
  ('FR-SFR', 'FR', 'SFR', 1, 1.0),
  ('FR-BT', 'FR', 'Bouygues', 1, 1.0);

INSERT OR IGNORE INTO providers (id, name, slug, type, config, status, health_score, last_checked_at, created_at, updated_at)
VALUES ('manual-pool-001', 'Manual Pool', 'manual_pool', 'manual_pool', '{}', 'active', 100, datetime('now'), datetime('now'), datetime('now'));

INSERT OR IGNORE INTO system_settings (key, value, description, category, updated_by, updated_at)
VALUES
  ('otp_regex', '"[0-9]{4,8}"', 'Regex pattern used to extract OTP codes from SMS bodies', 'sms_validation', NULL, datetime('now')),
  ('otp_min_length', '4', 'Minimum length of an extracted OTP', 'sms_validation', NULL, datetime('now')),
  ('otp_max_length', '8', 'Maximum length of an extracted OTP', 'sms_validation', NULL, datetime('now')),
  ('min_withdrawal_cents', '5000', 'Minimum withdrawal amount in cents', 'wallet', NULL, datetime('now')),
  ('default_number_limit', '50', 'Default number assignment limit per user', 'numbers', NULL, datetime('now')),
  ('rate_limit_default', '3600', 'Default requests per hour per API key', 'api', NULL, datetime('now')),
  ('rate_limit_sms_ingest', '60', 'Max SMS ingest requests per minute per IP', 'api', NULL, datetime('now')),
  ('maintenance_mode', '0', 'When 1, the platform is in maintenance mode', 'maintenance', NULL, datetime('now')),
  ('maintenance_message', '"Platform is under maintenance. Please check back soon."', 'Maintenance mode message', 'maintenance', NULL, datetime('now')),
  ('auto_assign_numbers', '1', 'Auto-assign numbers from available pool on request', 'numbers', NULL, datetime('now')),
  ('reward_auto_approve', '1', 'Auto-approve reward events immediately', 'rewards', NULL, datetime('now')),
  ('webhook_max_attempts', '3', 'Maximum delivery attempts for webhook events', 'providers', NULL, datetime('now')),
  ('webhook_retry_schedule', '"10,60,300"', 'Retry delays in seconds for webhook delivery', 'providers', NULL, datetime('now')),
  ('default_user_tier', '"bronze"', 'Default user tier assigned on registration', 'rewards', NULL, datetime('now')),
  ('analytics_past_days', '90', 'Number of days to retain detailed analytics', 'analytics', NULL, datetime('now'));

INSERT OR IGNORE INTO api_keys (id, user_id, key_hash, key_prefix, secret_hash, webhook_url, webhook_events, permissions, rate_limit_override, last_used_at, created_at)
VALUES ('demo-api-key-001', 'demo-user-001', '0000000000000000000000000000000000000000000000000000000000000000', 'ipk_live_demo', '0000000000000000000000000000000000000000000000000000000000000000', NULL, '[]', '["sms.read","wallet.read","numbers.read","rewards.read","otp.read","webhooks.manage","withdrawals.create","ingest"]', NULL, NULL, datetime('now'));

INSERT OR IGNORE INTO api_keys (id, user_id, key_hash, key_prefix, secret_hash, webhook_url, webhook_events, permissions, rate_limit_override, last_used_at, created_at)
VALUES ('admin-api-key-001', 'admin-user-001', '0000000000000000000000000000000000000000000000000000000000000000', 'ipk_live_admin', '0000000000000000000000000000000000000000000000000000000000000000', NULL, '[]', '["admin"]', NULL, NULL, datetime('now'));
