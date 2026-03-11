-- ============================================
-- 1. 히트맵용 서버 집계 RPC 함수
-- 클라이언트에서 전체 행을 가져와 날짜별로 세는 대신
-- DB에서 GROUP BY date로 집계하여 반환 (행 수 대폭 감소)
-- ============================================

CREATE OR REPLACE FUNCTION public.get_solve_heatmap(
  p_user_id UUID,
  p_days INT DEFAULT 183  -- 약 26주
)
RETURNS TABLE(solve_date DATE, solve_count INT) AS $$
BEGIN
  RETURN QUERY
    SELECT
      (created_at AT TIME ZONE 'UTC')::date AS solve_date,
      COUNT(*)::int AS solve_count
    FROM user_solved_problems
    WHERE user_id = p_user_id
      AND created_at >= (NOW() - (p_days || ' days')::interval)
    GROUP BY 1
    ORDER BY 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================
-- 2. 누락된 인덱스 추가
-- ============================================

-- 히트맵 쿼리 최적화: user_id + created_at 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_user_solved_created
  ON user_solved_problems(user_id, created_at DESC);

-- discussions 복합 인덱스: problem_id + is_solution 동시 필터링
CREATE INDEX IF NOT EXISTS idx_discussions_problem_solution
  ON discussions(problem_id, is_solution);

-- topics 정렬 최적화
CREATE INDEX IF NOT EXISTS idx_topics_created_at
  ON topics(created_at DESC);

-- topic_comments 조회 최적화
CREATE INDEX IF NOT EXISTS idx_topic_comments_topic_created
  ON topic_comments(topic_id, created_at);
