-- 새 컬럼 추가
ALTER TABLE problems
  ADD COLUMN IF NOT EXISTS external_url text,
  ADD COLUMN IF NOT EXISTS difficulty integer DEFAULT 5 CHECK (difficulty BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS subject text DEFAULT 'physics',
  ADD COLUMN IF NOT EXISTS concepts text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hint_1 text,
  ADD COLUMN IF NOT EXISTS hint_2 text,
  ADD COLUMN IF NOT EXISTS hint_3 text;

-- content, official_solution을 optional로 변경 (기존 데이터 호환)
ALTER TABLE problems ALTER COLUMN content DROP NOT NULL;
ALTER TABLE problems ALTER COLUMN official_solution DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_problems_subject ON problems(subject);
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty);

-- 기존 시드 데이터 과목 분류
UPDATE problems SET subject = 'physics' WHERE source ILIKE '%PhO%' OR source ILIKE '%물리%' OR source ILIKE '%physics%';
UPDATE problems SET subject = 'chemistry' WHERE source ILIKE '%ChO%' OR source ILIKE '%화학%' OR source ILIKE '%chemistry%';
UPDATE problems SET subject = 'biology' WHERE source ILIKE '%BO%' OR source ILIKE '%생물%' OR source ILIKE '%biology%';
UPDATE problems SET subject = 'math' WHERE source ILIKE '%MO%' OR source ILIKE '%수학%' OR source ILIKE '%math%';
