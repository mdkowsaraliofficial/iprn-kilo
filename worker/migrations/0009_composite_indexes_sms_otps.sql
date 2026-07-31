-- 0009_composite_indexes_sms_otps.sql
CREATE INDEX IF NOT EXISTS idx_sms_user_created ON sms_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_number_created ON sms_messages(number_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_country_created ON sms_messages(country, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_status_created ON sms_messages(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_user_status_created ON sms_messages(user_id, status, created_at DESC);
