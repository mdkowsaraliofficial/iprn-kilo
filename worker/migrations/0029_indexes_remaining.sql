-- 0029_indexes_remaining.sql
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_url ON webhook_deliveries(url);
CREATE INDEX IF NOT EXISTS idx_sms_number_created_desc ON sms_messages(number_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_numbers_assigned_user_status ON numbers(assigned_user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_desc ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_countries_active_name ON countries(active, name);
