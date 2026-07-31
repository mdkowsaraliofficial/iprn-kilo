-- 0018_composite_indexes_analytics.sql
CREATE INDEX IF NOT EXISTS idx_analytics_hour_day_country ON analytics_hour(bucket_hour, country_code);
CREATE INDEX IF NOT EXISTS idx_analytics_day_day_country ON analytics_day(bucket_day, country_code);
CREATE INDEX IF NOT EXISTS idx_analytics_day_country_sms ON analytics_day(country_code, sms_count DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_hour_day_time ON analytics_hour(bucket_hour DESC);
