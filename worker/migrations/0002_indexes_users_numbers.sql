-- 0002_indexes_users_numbers.sql
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_numbers_country ON numbers(country_code);
CREATE INDEX IF NOT EXISTS idx_numbers_operator ON numbers(operator);
CREATE INDEX IF NOT EXISTS idx_numbers_provider ON numbers(provider_id);
CREATE INDEX IF NOT EXISTS idx_numbers_status ON numbers(status);
CREATE INDEX IF NOT EXISTS idx_numbers_assigned_user ON numbers(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_numbers_quality ON numbers(quality_score);
CREATE INDEX IF NOT EXISTS idx_numbers_last_sms ON numbers(last_sms_at);
CREATE INDEX IF NOT EXISTS idx_numbers_created_at ON numbers(created_at);
CREATE INDEX IF NOT EXISTS idx_numbers_e164 ON numbers(e164);

CREATE INDEX IF NOT EXISTS idx_assignments_number ON number_assignments(number_id);
CREATE INDEX IF NOT EXISTS idx_assignments_user ON number_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON number_assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_at ON number_assignments(assigned_at);
