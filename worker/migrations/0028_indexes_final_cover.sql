-- 0028_indexes_final_cover.sql
CREATE INDEX IF NOT EXISTS idx_sms_user_created_desc ON sms_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reward_events_created_desc ON reward_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_created_desc ON wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_created_desc ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_desc ON audit_logs(created_at DESC);
