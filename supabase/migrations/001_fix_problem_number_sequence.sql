-- 기존 문제의 problem_number를 1000번부터 시작하도록 수정
-- "우주선 Logic호" 문제를 #1000으로 설정
UPDATE problems SET problem_number = 1000 WHERE id = 'custom-1773122073507';

-- 시퀀스를 1001부터 시작하도록 설정 (다음 문제부터 1001, 1002, ...)
SELECT setval('problems_problem_number_seq', (SELECT COALESCE(MAX(problem_number), 999) FROM problems));
