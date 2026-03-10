-- ============================================
-- 002: RLS 정책 수정 및 누락된 테이블 추가
-- ============================================
-- 기존 DB에 이 마이그레이션을 적용하세요.

-- 1. solution_upvotes 테이블 추가 (SolutionSection에서 사용하지만 누락됨)
create table if not exists solution_upvotes (
  user_id uuid references profiles(id) on delete cascade,
  solution_id text references discussions(id) on delete cascade,
  primary key (user_id, solution_id)
);

alter table solution_upvotes enable row level security;
create policy "Anyone can view solution upvotes" on solution_upvotes for select using (true);
create policy "Users can insert solution upvotes" on solution_upvotes for insert with check (user_id = auth.uid());
create policy "Users can delete solution upvotes" on solution_upvotes for delete using (user_id = auth.uid());

create index if not exists idx_solution_upvotes_solution_id on solution_upvotes(solution_id);

-- 2. discussions: UPDATE 정책 추가 (풀이 수정 기능)
create policy "Users can update own discussions" on discussions for update using (author_id = auth.uid());
create policy "Admins can update any discussion" on discussions for update using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- 3. discussions: 관리자 DELETE 정책 추가
create policy "Admins can delete any discussion" on discussions for delete using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- 4. topics: DELETE 정책 추가 (현재 아예 없음)
create policy "Users can delete own topics" on topics for delete using (author_id = auth.uid());
create policy "Admins can delete any topic" on topics for delete using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- 5. topic_comments: 관리자 DELETE 정책 추가
create policy "Admins can delete any topic comment" on topic_comments for delete using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- 6. user_solved_problems: 공개 조회 허용 (문제별 풀이 수 표시)
-- 이미 "Anyone can count solved problems" 정책이 있을 수 있으므로 IF NOT EXISTS 사용 불가
-- DO 블록으로 안전하게 처리
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_solved_problems'
    AND policyname = 'Anyone can count solved problems'
  ) THEN
    EXECUTE 'create policy "Anyone can count solved problems" on user_solved_problems for select using (true)';
  END IF;
END
$$;

-- 7. discussions: is_solution 컬럼 (이미 있을 수 있음)
alter table discussions add column if not exists is_solution boolean default false;

-- 8. discussions 인덱스 추가 (is_solution 필터링 최적화)
create index if not exists idx_discussions_is_solution on discussions(is_solution);
create index if not exists idx_discussions_author_id on discussions(author_id);
