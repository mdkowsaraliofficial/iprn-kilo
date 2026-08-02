-- 0008_composite_indexes_users_numbers.sql
CREATE INDEX IF NOT EXISTS idx_numbers_status_country ON numbers(status, country_code);
CREATE INDEX IF NOT EXISTS idx_numbers_provider_status ON numbers(provider_id, status);
CREATE INDEX IF NOT EXISTS idx_users_email_status ON users(email, status);
