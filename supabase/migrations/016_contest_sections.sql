-- ============================================================
-- 016: Contest Sections & Problem Section Field
-- ============================================================

-- Add sections array to contests
ALTER TABLE contests
  ADD COLUMN IF NOT EXISTS sections text[] NOT NULL DEFAULT '{}';

-- Add section field to problems
ALTER TABLE problems
  ADD COLUMN IF NOT EXISTS section text;
