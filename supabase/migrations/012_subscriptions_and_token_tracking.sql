-- ============================================================
-- 012: Subscriptions & Weekly Token Tracking
-- ============================================================

-- Add subscription fields to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_tier text NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'plus')),
  ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- Token usage tracking (weekly reset)
CREATE TABLE IF NOT EXISTS ai_token_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  tokens_used bigint NOT NULL DEFAULT 0,
  request_count int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_ai_token_usage_user_week
  ON ai_token_usage (user_id, week_start);

-- RLS policies
ALTER TABLE ai_token_usage ENABLE ROW LEVEL SECURITY;

-- Users can read their own token usage
CREATE POLICY "Users read own token usage"
  ON ai_token_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Server (service role) handles insert/update via API route
-- Users cannot directly modify token usage
CREATE POLICY "Service role manages token usage"
  ON ai_token_usage FOR ALL
  USING (auth.role() = 'service_role');

-- Function to get current week's token usage
CREATE OR REPLACE FUNCTION get_weekly_token_usage(p_user_id uuid)
RETURNS TABLE(tokens_used bigint, request_count int, week_start date) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(t.tokens_used, 0)::bigint,
    COALESCE(t.request_count, 0)::int,
    date_trunc('week', CURRENT_DATE)::date AS week_start
  FROM (SELECT 1) AS dummy
  LEFT JOIN ai_token_usage t
    ON t.user_id = p_user_id
    AND t.week_start = date_trunc('week', CURRENT_DATE)::date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment token usage (called from API)
CREATE OR REPLACE FUNCTION increment_token_usage(
  p_user_id uuid,
  p_tokens bigint
) RETURNS void AS $$
BEGIN
  INSERT INTO ai_token_usage (user_id, week_start, tokens_used, request_count, updated_at)
  VALUES (
    p_user_id,
    date_trunc('week', CURRENT_DATE)::date,
    p_tokens,
    1,
    now()
  )
  ON CONFLICT (user_id, week_start)
  DO UPDATE SET
    tokens_used = ai_token_usage.tokens_used + p_tokens,
    request_count = ai_token_usage.request_count + 1,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
