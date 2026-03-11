-- ============================================
-- Logic of The Cosmos - Supabase Database Schema
-- ============================================
-- Supabase 대시보드의 SQL Editor에서 실행하세요.

-- 1. Profiles (auth.users 확장)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null,
  bio text default '',
  is_admin boolean default false,
  created_at timestamptz default now()
);

-- 새 유저 가입 시 자동으로 profile 생성
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', '사용자'), new.email);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Problems
create table if not exists problems (
  id text primary key,
  problem_number serial NOT NULL,
  title text not null,
  source text not null,
  year int not null,
  tags text[] default '{}',
  content text not null,
  official_solution text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- problem_number 시퀀스를 1000부터 시작
ALTER SEQUENCE problems_problem_number_seq RESTART WITH 1000;

-- 3. Discussions (문제 토론 + 풀이)
create table if not exists discussions (
  id text primary key default gen_random_uuid()::text,
  problem_id text references problems(id) on delete cascade not null,
  author_id uuid references profiles(id) on delete set null,
  author_name text not null,
  content text not null,
  parent_id text references discussions(id) on delete cascade,
  is_solution boolean default false,
  created_at timestamptz default now()
);

-- 4. Topics (커뮤니티 토픽)
create table if not exists topics (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  content text not null,
  author_id uuid references profiles(id) on delete set null,
  author_name text not null,
  tags text[] default '{}',
  upvotes int default 0,
  created_at timestamptz default now()
);

-- 5. Topic Comments
create table if not exists topic_comments (
  id text primary key default gen_random_uuid()::text,
  topic_id text references topics(id) on delete cascade not null,
  author_id uuid references profiles(id) on delete set null,
  author_name text not null,
  content text not null,
  parent_id text references topic_comments(id) on delete cascade,
  upvotes int default 0,
  created_at timestamptz default now()
);

-- 6. Contests
create table if not exists contests (
  id text primary key,
  name text not null,
  short_name text not null,
  description text not null,
  website text,
  years int[] default '{}'
);

-- 7. User Solved Problems (다대다)
create table if not exists user_solved_problems (
  user_id uuid references profiles(id) on delete cascade,
  problem_id text references problems(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, problem_id)
);

-- 8. User Bookmarked Problems (다대다)
create table if not exists user_bookmarked_problems (
  user_id uuid references profiles(id) on delete cascade,
  problem_id text references problems(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, problem_id)
);

-- 9. Topic Upvotes (중복 투표 방지)
create table if not exists topic_upvotes (
  user_id uuid references profiles(id) on delete cascade,
  topic_id text references topics(id) on delete cascade,
  primary key (user_id, topic_id)
);

-- 10. Comment Upvotes (중복 투표 방지)
create table if not exists comment_upvotes (
  user_id uuid references profiles(id) on delete cascade,
  comment_id text references topic_comments(id) on delete cascade,
  primary key (user_id, comment_id)
);

-- 11. Solution Upvotes (풀이 추천)
create table if not exists solution_upvotes (
  user_id uuid references profiles(id) on delete cascade,
  solution_id text references discussions(id) on delete cascade,
  primary key (user_id, solution_id)
);

-- 12. User Stats (프로필 통계 사전 집계)
create table if not exists user_stats (
  user_id uuid references profiles(id) on delete cascade primary key,
  solved_count int not null default 0,
  solution_count int not null default 0,
  discussion_count int not null default 0
);

-- ============================================
-- Row Level Security (RLS) 정책
-- ============================================

-- Profiles
alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Problems
alter table problems enable row level security;
create policy "Problems are viewable by everyone" on problems for select using (true);
create policy "Admins can insert problems" on problems for insert with check (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);
create policy "Admins can update problems" on problems for update using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);
create policy "Admins can delete problems" on problems for delete using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- Discussions
alter table discussions enable row level security;
create policy "Discussions are viewable by everyone" on discussions for select using (true);
create policy "Authenticated users can create discussions" on discussions for insert with check (auth.uid() is not null);
create policy "Users can update own discussions" on discussions for update using (author_id = auth.uid());
create policy "Admins can update any discussion" on discussions for update using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);
create policy "Users can delete own discussions" on discussions for delete using (author_id = auth.uid());
create policy "Admins can delete any discussion" on discussions for delete using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- Topics
alter table topics enable row level security;
create policy "Topics are viewable by everyone" on topics for select using (true);
create policy "Authenticated users can create topics" on topics for insert with check (auth.uid() is not null);
create policy "Users can update own topics" on topics for update using (author_id = auth.uid());
create policy "Admins can update any topic" on topics for update using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);
create policy "Users can delete own topics" on topics for delete using (author_id = auth.uid());
create policy "Admins can delete any topic" on topics for delete using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- Topic Comments
alter table topic_comments enable row level security;
create policy "Topic comments are viewable by everyone" on topic_comments for select using (true);
create policy "Authenticated users can create topic comments" on topic_comments for insert with check (auth.uid() is not null);
create policy "Users can delete own comments" on topic_comments for delete using (author_id = auth.uid());
create policy "Admins can delete any topic comment" on topic_comments for delete using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- Contests
alter table contests enable row level security;
create policy "Contests are viewable by everyone" on contests for select using (true);
create policy "Admins can insert contests" on contests for insert with check (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);
create policy "Admins can update contests" on contests for update using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);
create policy "Admins can delete contests" on contests for delete using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- User Solved Problems (공개 조회 허용 — 문제별 풀이 수 표시)
alter table user_solved_problems enable row level security;
create policy "Anyone can view solved problems" on user_solved_problems for select using (true);
create policy "Users can insert own solved" on user_solved_problems for insert with check (user_id = auth.uid());
create policy "Users can delete own solved" on user_solved_problems for delete using (user_id = auth.uid());

-- User Bookmarked Problems (본인만 조회 — 서버는 쿠키 기반 auth.uid()로 접근)
alter table user_bookmarked_problems enable row level security;
create policy "Users can view own bookmarks" on user_bookmarked_problems for select using (user_id = auth.uid());
create policy "Users can insert own bookmarks" on user_bookmarked_problems for insert with check (user_id = auth.uid());
create policy "Users can delete own bookmarks" on user_bookmarked_problems for delete using (user_id = auth.uid());

-- Topic Upvotes
alter table topic_upvotes enable row level security;
create policy "Users can view own topic upvotes" on topic_upvotes for select using (user_id = auth.uid());
create policy "Users can insert topic upvotes" on topic_upvotes for insert with check (user_id = auth.uid());
create policy "Users can delete topic upvotes" on topic_upvotes for delete using (user_id = auth.uid());

-- Comment Upvotes
alter table comment_upvotes enable row level security;
create policy "Users can view own comment upvotes" on comment_upvotes for select using (user_id = auth.uid());
create policy "Users can insert comment upvotes" on comment_upvotes for insert with check (user_id = auth.uid());
create policy "Users can delete comment upvotes" on comment_upvotes for delete using (user_id = auth.uid());

-- Solution Upvotes (공개 조회 허용 — 풀이 추천 수 표시)
alter table solution_upvotes enable row level security;
create policy "Anyone can view solution upvotes" on solution_upvotes for select using (true);
create policy "Users can insert solution upvotes" on solution_upvotes for insert with check (user_id = auth.uid());
create policy "Users can delete solution upvotes" on solution_upvotes for delete using (user_id = auth.uid());

-- User Stats (공개 읽기 전용 — 트리거로만 쓰기)
alter table user_stats enable row level security;
create policy "Anyone can view user stats" on user_stats for select using (true);

-- ============================================
-- 인덱스
-- ============================================
create index if not exists idx_discussions_problem_id on discussions(problem_id);
create index if not exists idx_discussions_is_solution on discussions(is_solution);
create index if not exists idx_discussions_author_id on discussions(author_id);
create index if not exists idx_topic_comments_topic_id on topic_comments(topic_id);
create index if not exists idx_problems_source on problems(source);
create index if not exists idx_problems_year on problems(year);
create index if not exists idx_user_solved_problem_id on user_solved_problems(problem_id);
create index if not exists idx_user_solved_created on user_solved_problems(user_id, created_at desc);
create index if not exists idx_discussions_problem_solution on discussions(problem_id, is_solution);
create index if not exists idx_topics_created_at on topics(created_at desc);
create index if not exists idx_topic_comments_topic_created on topic_comments(topic_id, created_at);
create index if not exists idx_solution_upvotes_solution_id on solution_upvotes(solution_id);

-- ============================================
-- RPC 함수
-- ============================================

-- 히트맵용 서버 집계 (날짜별 풀이 수)
CREATE OR REPLACE FUNCTION public.get_solve_heatmap(
  p_user_id UUID,
  p_days INT DEFAULT 183
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
