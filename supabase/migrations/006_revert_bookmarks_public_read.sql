-- ============================================
-- 006: user_bookmarked_problems SELECT 정책 복원
-- ============================================
-- 쿠키 기반 인증으로 전환하여 서버에서 auth.uid()를 사용할 수 있게 됨.
-- 005에서 추가한 공개 SELECT를 제거하고 본인만 조회 가능하도록 복원.

DO $$
BEGIN
  -- 공개 SELECT 정책 제거
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_bookmarked_problems'
    AND policyname = 'Anyone can view bookmarked problems'
  ) THEN
    DROP POLICY "Anyone can view bookmarked problems" ON user_bookmarked_problems;
  END IF;

  -- 본인 조회 정책 복원
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_bookmarked_problems'
    AND policyname = 'Users can view own bookmarks'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view own bookmarks" ON user_bookmarked_problems FOR SELECT USING (user_id = auth.uid())';
  END IF;
END
$$;
