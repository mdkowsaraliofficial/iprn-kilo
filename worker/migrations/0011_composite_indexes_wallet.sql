-- 0011_composite_indexes_wallet.sql
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user_type_created ON wallet_transactions(user_id, type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user_created ON wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_source ON wallet_transactions(source_type, created_at DESC);
