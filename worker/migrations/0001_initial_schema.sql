-- 0001_initial_schema.sql
-- Core tables: users, numbers, assignments, sms, otps, rewards

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active','banned','pending')),
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  number_limit_override INTEGER,
  api_enabled INTEGER NOT NULL DEFAULT 1,
  tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze','silver','gold','platinum')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS numbers (
  id TEXT PRIMARY KEY,
  e164 TEXT NOT NULL UNIQUE,
  country_code TEXT NOT NULL,
  operator TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','assigned','suspended','expired')),
  quality_score REAL NOT NULL DEFAULT 0,
  notes TEXT,
  last_sms_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  assigned_user_id TEXT,
  FOREIGN KEY (provider_id) REFERENCES providers(id),
  FOREIGN KEY (assigned_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS number_assignments (
  id TEXT PRIMARY KEY,
  number_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
  released_at TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','released')),
  FOREIGN KEY (number_id) REFERENCES numbers(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS sms_messages (
  id TEXT PRIMARY KEY,
  number_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  sender TEXT NOT NULL,
  body TEXT NOT NULL,
  extracted_otp TEXT,
  country TEXT NOT NULL,
  operator TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received','processed','failed')),
  reward_event_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (number_id) REFERENCES numbers(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (provider_id) REFERENCES providers(id),
  FOREIGN KEY (reward_event_id) REFERENCES reward_events(id)
);

CREATE TABLE IF NOT EXISTS otps (
  id TEXT PRIMARY KEY,
  sms_id TEXT NOT NULL,
  number_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  code TEXT NOT NULL,
  extracted_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (sms_id) REFERENCES sms_messages(id),
  FOREIGN KEY (number_id) REFERENCES numbers(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS reward_rules (
  id TEXT PRIMARY KEY,
  level TEXT NOT NULL CHECK (level IN ('global','per_sms','per_otp','per_country','per_operator','per_provider','per_number')),
  target TEXT,
  base_amount_cents INTEGER NOT NULL DEFAULT 0,
  multiplier REAL NOT NULL DEFAULT 1,
  priority INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  valid_from TEXT,
  valid_to TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reward_events (
  id TEXT PRIMARY KEY,
  sms_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  rule_id TEXT NOT NULL,
  base_amount_cents INTEGER NOT NULL,
  country_multiplier REAL NOT NULL,
  operator_multiplier REAL NOT NULL,
  user_tier_multiplier REAL NOT NULL,
  final_amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','reversed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (sms_id) REFERENCES sms_messages(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (rule_id) REFERENCES reward_rules(id)
);

CREATE TABLE IF NOT EXISTS wallet_balances (
  user_id TEXT PRIMARY KEY,
  pending_cents INTEGER NOT NULL DEFAULT 0,
  approved_cents INTEGER NOT NULL DEFAULT 0,
  frozen_cents INTEGER NOT NULL DEFAULT 0,
  lifetime_earned_cents INTEGER NOT NULL DEFAULT 0,
  lifetime_withdrawn_cents INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('reward','manual_credit','manual_debit','withdrawal','reversal','bonus')),
  amount_cents INTEGER NOT NULL,
  balance_after_cents INTEGER NOT NULL,
  source_type TEXT,
  source_id TEXT,
  performed_by_user_id TEXT,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (performed_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('crypto','bank_transfer','paypal','other')),
  address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','approved','rejected','completed')),
  reviewed_by TEXT,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  processed_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  number_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('number_purchase','subscription')),
  status TEXT NOT NULL CHECK (status IN ('pending','completed','cancelled','refunded')),
  amount_cents INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (number_id) REFERENCES numbers(id)
);

CREATE TABLE IF NOT EXISTS providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('manual_pool','http_api','twilio','plivo','signalwire')),
  config TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','degraded')),
  health_score REAL NOT NULL DEFAULT 100,
  last_checked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS provider_health_log (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy','degraded','down')),
  response_time_ms INTEGER,
  error_message TEXT,
  checked_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (provider_id) REFERENCES providers(id)
);

CREATE TABLE IF NOT EXISTS countries (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  base_reward_multiplier REAL NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS operators (
  id TEXT PRIMARY KEY,
  country_code TEXT NOT NULL,
  name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  reward_multiplier REAL NOT NULL DEFAULT 1,
  FOREIGN KEY (country_code) REFERENCES countries(code)
);

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  secret_hash TEXT NOT NULL,
  webhook_url TEXT,
  webhook_events TEXT NOT NULL DEFAULT '[]',
  permissions TEXT NOT NULL DEFAULT '[]',
  rate_limit_override INTEGER,
  last_used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS api_usage_logs (
  id TEXT PRIMARY KEY,
  api_key_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER NOT NULL,
  ip TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (api_key_id) REFERENCES api_keys(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  api_key_id TEXT,
  event_type TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed','retrying')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TEXT,
  next_retry_at TEXT,
  response_status INTEGER,
  response_body TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (api_key_id) REFERENCES api_keys(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info','warning','success','error','system')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  data TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  updated_by TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS sse_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS analytics_hour (
  bucket_hour TEXT NOT NULL,
  country_code TEXT,
  operator TEXT,
  provider_id TEXT,
  sms_count INTEGER NOT NULL DEFAULT 0,
  otp_count INTEGER NOT NULL DEFAULT 0,
  reward_total_cents INTEGER NOT NULL DEFAULT 0,
  unique_users INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket_hour, country_code, operator, provider_id)
);

CREATE TABLE IF NOT EXISTS analytics_day (
  bucket_day TEXT NOT NULL,
  country_code TEXT,
  operator TEXT,
  provider_id TEXT,
  sms_count INTEGER NOT NULL DEFAULT 0,
  otp_count INTEGER NOT NULL DEFAULT 0,
  reward_total_cents INTEGER NOT NULL DEFAULT 0,
  unique_users INTEGER NOT NULL DEFAULT 0,
  new_users INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket_day, country_code, operator, provider_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  changes TEXT,
  ip TEXT,
  user_agent TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('info','warning','critical')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS system_logs (
  id TEXT PRIMARY KEY,
  level TEXT NOT NULL CHECK (level IN ('debug','info','warn','error')),
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  context TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
