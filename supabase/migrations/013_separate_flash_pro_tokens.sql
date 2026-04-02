-- ============================================================
-- 013: Separate Flash/Pro Token Tracking
-- ============================================================

-- Add separate columns for flash and pro tokens
ALTER TABLE ai_token_usage
  ADD COLUMN IF NOT EXISTS flash_tokens_used bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pro_tokens_used bigint NOT NULL DEFAULT 0;

-- Migrate existing data (assume all previous usage was flash)
UPDATE ai_token_usage SET flash_tokens_used = tokens_used WHERE flash_tokens_used = 0 AND tokens_used > 0;

-- Update the get function to return separate counts
CREATE OR REPLACE FUNCTION get_weekly_token_usage(p_user_id uuid)
RETURNS TABLE(tokens_used bigint, flash_tokens_used bigint, pro_tokens_used bigint, request_count int, week_start date) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(t.tokens_used, 0)::bigint,
    COALESCE(t.flash_tokens_used, 0)::bigint,
    COALESCE(t.pro_tokens_used, 0)::bigint,
    COALESCE(t.request_count, 0)::int,
    date_trunc('week', CURRENT_DATE)::date AS week_start
  FROM (SELECT 1) AS dummy
  LEFT JOIN ai_token_usage t
    ON t.user_id = p_user_id
    AND t.week_start = date_trunc('week', CURRENT_DATE)::date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update increment function to accept model type
CREATE OR REPLACE FUNCTION increment_token_usage(
  p_user_id uuid,
  p_tokens bigint,
  p_model text DEFAULT 'flash'
) RETURNS void AS $$
BEGIN
  INSERT INTO ai_token_usage (user_id, week_start, tokens_used, flash_tokens_used, pro_tokens_used, request_count, updated_at)
  VALUES (
    p_user_id,
    date_trunc('week', CURRENT_DATE)::date,
    p_tokens,
    CASE WHEN p_model = 'flash' THEN p_tokens ELSE 0 END,
    CASE WHEN p_model = 'pro' THEN p_tokens ELSE 0 END,
    1,
    now()
  )
  ON CONFLICT (user_id, week_start)
  DO UPDATE SET
    tokens_used = ai_token_usage.tokens_used + p_tokens,
    flash_tokens_used = ai_token_usage.flash_tokens_used + CASE WHEN p_model = 'flash' THEN p_tokens ELSE 0 END,
    pro_tokens_used = ai_token_usage.pro_tokens_used + CASE WHEN p_model = 'pro' THEN p_tokens ELSE 0 END,
    request_count = ai_token_usage.request_count + 1,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
