-- 0005_indexes_providers_countries_operators.sql
CREATE INDEX IF NOT EXISTS idx_providers_slug ON providers(slug);
CREATE INDEX IF NOT EXISTS idx_providers_status ON providers(status);
CREATE INDEX IF NOT EXISTS idx_providers_type ON providers(type);
CREATE INDEX IF NOT EXISTS idx_providers_last_checked ON providers(last_checked_at);
CREATE INDEX IF NOT EXISTS idx_providers_health_score ON providers(health_score);

CREATE INDEX IF NOT EXISTS idx_provider_health_provider ON provider_health_log(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_health_checked_at ON provider_health_log(checked_at);

CREATE INDEX IF NOT EXISTS idx_countries_code ON countries(code);
CREATE INDEX IF NOT EXISTS idx_countries_active ON countries(active);

CREATE INDEX IF NOT EXISTS idx_operators_country ON operators(country_code);
CREATE INDEX IF NOT EXISTS idx_operators_active ON operators(active);
CREATE INDEX IF NOT EXISTS idx_operators_name ON operators(name);
