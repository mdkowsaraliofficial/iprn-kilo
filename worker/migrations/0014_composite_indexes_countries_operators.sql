-- 0014_composite_indexes_countries_operators.sql
CREATE INDEX IF NOT EXISTS idx_countries_code_active ON countries(code, active);
CREATE INDEX IF NOT EXISTS idx_operators_country_active ON operators(country_code, active);
