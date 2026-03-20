CREATE TABLE IF NOT EXISTS ai_analyses (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  problem_id text REFERENCES problems(id) ON DELETE CASCADE NOT NULL,
  user_solution text NOT NULL,
  score integer,
  feedback jsonb NOT NULL,
  model text DEFAULT 'gemini-2.5-flash',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS usage_daily (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  date date DEFAULT CURRENT_DATE,
  ai_analyses_count integer DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analyses" ON ai_analyses FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create analyses" ON ai_analyses FOR INSERT WITH CHECK (user_id = auth.uid());

ALTER TABLE usage_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage" ON usage_daily FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can upsert own usage" ON usage_daily FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own usage" ON usage_daily FOR UPDATE USING (user_id = auth.uid());

CREATE INDEX idx_ai_analyses_user ON ai_analyses(user_id, created_at DESC);
CREATE INDEX idx_ai_analyses_problem ON ai_analyses(problem_id);

-- profiles 테이블에 subscription 컬럼 추가 (아직 없다면)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free';
