-- 0023_indexes_numbers_availability.sql
CREATE INDEX IF NOT EXISTS idx_numbers_available_country ON numbers(country_code, status) WHERE status = 'available';
CREATE INDEX IF NOT EXISTS idx_numbers_quality_operator ON numbers(quality_score DESC, operator);
CREATE INDEX IF NOT EXISTS idx_number_assignments_active ON number_assignments(status, assigned_at DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_sms_provider_country ON sms_messages(provider_id, country);
CREATE INDEX IF NOT EXISTS idx_analytics_day_country_provider ON analytics_day(country_code, provider_id);
