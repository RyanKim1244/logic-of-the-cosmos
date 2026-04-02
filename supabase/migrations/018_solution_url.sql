-- ============================================================
-- 018: Add solution URL for external problems
-- ============================================================

ALTER TABLE problems
  ADD COLUMN IF NOT EXISTS solution_url text;
