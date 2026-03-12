-- ============================================
-- 011: Study Groups, Problem Sets, Exam Sessions
-- ============================================

-- 1. Study Groups
create table if not exists study_groups (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  description text default '',
  owner_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now()
);

-- 2. Study Group Members
create table if not exists study_group_members (
  group_id text references study_groups(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);

-- 3. Problem Sets
create table if not exists problem_sets (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  description text default '',
  owner_id uuid references profiles(id) on delete cascade not null,
  is_public boolean default true,
  time_limit_minutes int default null,
  created_at timestamptz default now()
);

-- 4. Problem Set Items
create table if not exists problem_set_items (
  id text primary key default gen_random_uuid()::text,
  set_id text references problem_sets(id) on delete cascade not null,
  problem_id text references problems(id) on delete cascade not null,
  order_index int not null default 0,
  unique (set_id, problem_id)
);

-- 5. Exam Sessions
create table if not exists exam_sessions (
  id text primary key default gen_random_uuid()::text,
  user_id uuid references profiles(id) on delete cascade not null,
  problem_set_id text references problem_sets(id) on delete cascade not null,
  started_at timestamptz default now(),
  finished_at timestamptz default null,
  time_limit_minutes int not null,
  answers jsonb default '{}',
  score int default null
);

-- 6. Study Group Problem Sets (link sets to groups)
create table if not exists study_group_sets (
  group_id text references study_groups(id) on delete cascade,
  set_id text references problem_sets(id) on delete cascade,
  added_at timestamptz default now(),
  primary key (group_id, set_id)
);

-- ============================================
-- RLS Policies
-- ============================================

-- Study Groups
alter table study_groups enable row level security;
create policy "Study groups are viewable by everyone" on study_groups for select using (true);
create policy "Authenticated users can create study groups" on study_groups for insert with check (auth.uid() is not null);
create policy "Owners can update study groups" on study_groups for update using (owner_id = auth.uid());
create policy "Owners can delete study groups" on study_groups for delete using (owner_id = auth.uid());

-- Study Group Members
alter table study_group_members enable row level security;
create policy "Members are viewable by everyone" on study_group_members for select using (true);
create policy "Authenticated users can join groups" on study_group_members for insert with check (user_id = auth.uid());
create policy "Users can leave groups" on study_group_members for delete using (user_id = auth.uid());
create policy "Owners can remove members" on study_group_members for delete using (
  exists (select 1 from study_groups where id = group_id and owner_id = auth.uid())
);

-- Problem Sets
alter table problem_sets enable row level security;
create policy "Public sets are viewable by everyone" on problem_sets for select using (is_public = true or owner_id = auth.uid());
create policy "Authenticated users can create sets" on problem_sets for insert with check (auth.uid() is not null);
create policy "Owners can update sets" on problem_sets for update using (owner_id = auth.uid());
create policy "Owners can delete sets" on problem_sets for delete using (owner_id = auth.uid());

-- Problem Set Items
alter table problem_set_items enable row level security;
create policy "Set items are viewable if set is visible" on problem_set_items for select using (
  exists (select 1 from problem_sets where id = set_id and (is_public = true or owner_id = auth.uid()))
);
create policy "Set owners can manage items" on problem_set_items for insert with check (
  exists (select 1 from problem_sets where id = set_id and owner_id = auth.uid())
);
create policy "Set owners can delete items" on problem_set_items for delete using (
  exists (select 1 from problem_sets where id = set_id and owner_id = auth.uid())
);

-- Exam Sessions
alter table exam_sessions enable row level security;
create policy "Users can view own exam sessions" on exam_sessions for select using (user_id = auth.uid());
create policy "Users can create exam sessions" on exam_sessions for insert with check (user_id = auth.uid());
create policy "Users can update own exam sessions" on exam_sessions for update using (user_id = auth.uid());

-- Study Group Sets
alter table study_group_sets enable row level security;
create policy "Group sets are viewable by everyone" on study_group_sets for select using (true);
create policy "Group owners can add sets" on study_group_sets for insert with check (
  exists (select 1 from study_groups where id = group_id and owner_id = auth.uid())
);
create policy "Group owners can remove sets" on study_group_sets for delete using (
  exists (select 1 from study_groups where id = group_id and owner_id = auth.uid())
);

-- ============================================
-- Indexes
-- ============================================
create index if not exists idx_study_group_members_user on study_group_members(user_id);
create index if not exists idx_study_group_members_group on study_group_members(group_id);
create index if not exists idx_problem_set_items_set on problem_set_items(set_id, order_index);
create index if not exists idx_problem_sets_owner on problem_sets(owner_id);
create index if not exists idx_exam_sessions_user on exam_sessions(user_id);
create index if not exists idx_study_group_sets_group on study_group_sets(group_id);
