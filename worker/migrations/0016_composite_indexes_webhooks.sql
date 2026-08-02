-- 0016_composite_indexes_webhooks.sql
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_user_status ON webhook_deliveries(user_id, status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_apikey_status ON webhook_deliveries(api_key_id, status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_retry_time ON webhook_deliveries(next_retry_at, status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_event_time ON webhook_deliveries(event_type, created_at DESC);
