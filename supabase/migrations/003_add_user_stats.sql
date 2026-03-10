-- ============================================
-- user_stats: 프로필 통계용 사전 집계 테이블
-- discussions/user_solved_problems 변경 시 트리거로 자동 갱신
-- ============================================

-- 1. 테이블 생성
CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  solved_count INT NOT NULL DEFAULT 0,
  solution_count INT NOT NULL DEFAULT 0,
  discussion_count INT NOT NULL DEFAULT 0
);

-- 2. RLS (공개 읽기 전용, 쓰기는 트리거만)
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view user stats" ON user_stats FOR SELECT USING (true);

-- 3. 신규 유저 가입 시 user_stats 행 자동 생성
CREATE OR REPLACE FUNCTION public.handle_new_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_stats (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_stats
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_stats();

-- 4. user_solved_problems 트리거 → solved_count 갱신
CREATE OR REPLACE FUNCTION public.update_solved_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO user_stats (user_id, solved_count) VALUES (NEW.user_id, 1)
    ON CONFLICT (user_id) DO UPDATE SET solved_count = user_stats.solved_count + 1;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_stats SET solved_count = GREATEST(solved_count - 1, 0)
    WHERE user_id = OLD.user_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_user_solved_stats
  AFTER INSERT OR DELETE ON user_solved_problems
  FOR EACH ROW EXECUTE FUNCTION public.update_solved_count();

-- 5. discussions 트리거 → solution_count / discussion_count 갱신
CREATE OR REPLACE FUNCTION public.update_discussion_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.author_id IS NOT NULL THEN
      IF NEW.is_solution = true THEN
        INSERT INTO user_stats (user_id, solution_count) VALUES (NEW.author_id, 1)
        ON CONFLICT (user_id) DO UPDATE SET solution_count = user_stats.solution_count + 1;
      ELSE
        INSERT INTO user_stats (user_id, discussion_count) VALUES (NEW.author_id, 1)
        ON CONFLICT (user_id) DO UPDATE SET discussion_count = user_stats.discussion_count + 1;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.author_id IS NOT NULL THEN
      IF OLD.is_solution = true THEN
        UPDATE user_stats SET solution_count = GREATEST(solution_count - 1, 0)
        WHERE user_id = OLD.author_id;
      ELSE
        UPDATE user_stats SET discussion_count = GREATEST(discussion_count - 1, 0)
        WHERE user_id = OLD.author_id;
      END IF;
    END IF;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_discussions_stats
  AFTER INSERT OR DELETE ON discussions
  FOR EACH ROW EXECUTE FUNCTION public.update_discussion_stats();

-- 6. 기존 데이터 백필
INSERT INTO user_stats (user_id, solved_count, solution_count, discussion_count)
SELECT
  p.id,
  COALESCE(s.cnt, 0),
  COALESCE(sol.cnt, 0),
  COALESCE(d.cnt, 0)
FROM profiles p
LEFT JOIN (
  SELECT user_id, COUNT(*) AS cnt FROM user_solved_problems GROUP BY user_id
) s ON s.user_id = p.id
LEFT JOIN (
  SELECT author_id, COUNT(*) AS cnt FROM discussions
  WHERE is_solution = true GROUP BY author_id
) sol ON sol.author_id = p.id
LEFT JOIN (
  SELECT author_id, COUNT(*) AS cnt FROM discussions
  WHERE is_solution IS NULL OR is_solution = false GROUP BY author_id
) d ON d.author_id = p.id
ON CONFLICT (user_id) DO UPDATE SET
  solved_count = EXCLUDED.solved_count,
  solution_count = EXCLUDED.solution_count,
  discussion_count = EXCLUDED.discussion_count;
