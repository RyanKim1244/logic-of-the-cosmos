-- ============================================================
-- 017: Convert sections from text[] to JSONB tree
-- ============================================================

-- Migrate existing sections array to JSONB tree format
-- Old: sections = ['Theory', 'Experimental']
-- New: sections_tree = [{"name":"Theory","children":[]},{"name":"Experimental","children":[]}]

ALTER TABLE contests
  ADD COLUMN IF NOT EXISTS sections_tree jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Migrate existing data
UPDATE contests
SET sections_tree = (
  SELECT COALESCE(
    jsonb_agg(jsonb_build_object('name', s, 'children', '[]'::jsonb)),
    '[]'::jsonb
  )
  FROM unnest(sections) AS s
)
WHERE array_length(sections, 1) > 0;
