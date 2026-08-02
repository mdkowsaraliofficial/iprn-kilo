-- 0010_composite_indexes_rewards.sql
CREATE INDEX IF NOT EXISTS idx_reward_events_user_created ON reward_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reward_events_sms ON reward_events(sms_id);
CREATE INDEX IF NOT EXISTS idx_reward_events_status_created ON reward_events(status, created_at DESC);
