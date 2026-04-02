-- ============================================================
-- 014: Daily Request Count Tracking
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_daily_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date date NOT NULL,
  request_count int NOT NULL DEFAULT 0,
  UNIQUE (user_id, usage_date)
);

CREATE INDEX IF NOT EXISTS idx_ai_daily_usage_user_date
  ON ai_daily_usage (user_id, usage_date);

ALTER TABLE ai_daily_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own daily usage"
  ON ai_daily_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages daily usage"
  ON ai_daily_usage FOR ALL
  USING (auth.role() = 'service_role');

-- Get today's request count
CREATE OR REPLACE FUNCTION get_daily_request_count(p_user_id uuid)
RETURNS int AS $$
  SELECT COALESCE(
    (SELECT request_count FROM ai_daily_usage
     WHERE user_id = p_user_id AND usage_date = CURRENT_DATE),
    0
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Increment daily count
CREATE OR REPLACE FUNCTION increment_daily_request_count(p_user_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO ai_daily_usage (user_id, usage_date, request_count)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET request_count = ai_daily_usage.request_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
