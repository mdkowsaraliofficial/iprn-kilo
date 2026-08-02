-- 0013_composite_indexes_providers.sql
CREATE INDEX IF NOT EXISTS idx_providers_type_status ON providers(type, status);
CREATE INDEX IF NOT EXISTS idx_provider_health_provider_status ON provider_health_log(provider_id, status);
CREATE INDEX IF NOT EXISTS idx_provider_health_status_time ON provider_health_log(status, checked_at DESC);
