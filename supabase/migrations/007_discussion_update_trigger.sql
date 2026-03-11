-- ============================================
-- is_solution 값이 UPDATE로 변경될 때 user_stats 보정
-- 기존 트리거는 INSERT/DELETE만 처리하여
-- discussion → solution 채택 시 카운트가 어긋나는 버그 수정
-- ============================================

-- 1. UPDATE 처리를 포함하도록 트리거 함수 교체
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

  ELSIF TG_OP = 'UPDATE' THEN
    -- is_solution 값이 실제로 바뀐 경우에만 처리
    IF OLD.is_solution IS DISTINCT FROM NEW.is_solution AND NEW.author_id IS NOT NULL THEN
      IF NEW.is_solution = true THEN
        -- discussion → solution: discussion_count -1, solution_count +1
        UPDATE user_stats SET
          discussion_count = GREATEST(discussion_count - 1, 0),
          solution_count = solution_count + 1
        WHERE user_id = NEW.author_id;
      ELSE
        -- solution → discussion: solution_count -1, discussion_count +1
        UPDATE user_stats SET
          solution_count = GREATEST(solution_count - 1, 0),
          discussion_count = discussion_count + 1
        WHERE user_id = NEW.author_id;
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

-- 2. 기존 트리거를 UPDATE도 포함하도록 재생성
DROP TRIGGER IF EXISTS trg_discussions_stats ON discussions;
CREATE TRIGGER trg_discussions_stats
  AFTER INSERT OR UPDATE OR DELETE ON discussions
  FOR EACH ROW EXECUTE FUNCTION public.update_discussion_stats();
