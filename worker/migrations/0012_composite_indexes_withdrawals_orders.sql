-- 0012_composite_indexes_withdrawals_orders.sql
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_status ON withdrawal_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status_created ON withdrawal_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);
