-- ============================================
-- 005: user_bookmarked_problems 공개 SELECT 허용
-- ============================================
-- 서버 컴포넌트에서 anon key로 북마크 데이터를 읽으려면
-- 공개 SELECT 정책이 필요합니다.
-- 기존 정책: "Users can view own bookmarks" (auth.uid() 필요)
-- 추가 정책: 누구나 읽을 수 있게 허용 (user_solved_problems과 동일)

DO $$
BEGIN
  -- 기존 auth.uid() 기반 정책 제거
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_bookmarked_problems'
    AND policyname = 'Users can view own bookmarks'
  ) THEN
    DROP POLICY "Users can view own bookmarks" ON user_bookmarked_problems;
  END IF;

  -- 공개 SELECT 정책 추가
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_bookmarked_problems'
    AND policyname = 'Anyone can view bookmarked problems'
  ) THEN
    EXECUTE 'CREATE POLICY "Anyone can view bookmarked problems" ON user_bookmarked_problems FOR SELECT USING (true)';
  END IF;
END
$$;
