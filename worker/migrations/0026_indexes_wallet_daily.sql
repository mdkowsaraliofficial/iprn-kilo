-- 0026_indexes_wallet_daily.sql
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user_date ON wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_day_new_users ON analytics_day(bucket_day, new_users DESC);
CREATE INDEX IF NOT EXISTS idx_sms_otp_created ON sms_messages(created_at DESC) WHERE extracted_otp IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_numbers_provider_status_last ON numbers(provider_id, status, last_sms_at DESC);
