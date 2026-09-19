-- ============================================================================
-- Migration: 20260906000000_task_assignees_and_deletions.sql
-- Description: Task assignees junction table, cascade deletion constraints,
--              and RLS policy updates for STORY-006.
-- ============================================================================

-- 1. Ensure foreign key on projects.client_id cascades on client delete
do $$
begin
  if exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'projects_client_id_fkey'
      and table_name = 'projects'
  ) then
    alter table projects drop constraint projects_client_id_fkey;
  end if;
end $$;

alter table projects
  add constraint projects_client_id_fkey
  foreign key (client_id)
  references clients(id)
  on delete cascade;

-- 2. Create task_assignees junction table for multi-assignee collaboration
create table if not exists task_assignees (
  task_id     uuid references tasks(id) on delete cascade not null,
  profile_id  uuid references profiles(id) on delete cascade not null,
  company_id  uuid references companies(id) on delete cascade not null,
  created_at  timestamptz default now() not null,
  primary key (task_id, profile_id)
);

-- Performance & tenant indexes
create index if not exists idx_task_assignees_company on task_assignees(company_id);
create index if not exists idx_task_assignees_profile on task_assignees(profile_id);
create index if not exists idx_task_assignees_task on task_assignees(task_id);

-- 3. Enable RLS on task_assignees
alter table task_assignees enable row level security;

-- Drop existing policies if re-running
drop policy if exists task_assignees_select on task_assignees;
drop policy if exists task_assignees_insert on task_assignees;
drop policy if exists task_assignees_update on task_assignees;
drop policy if exists task_assignees_delete on task_assignees;

-- Strict tenant isolation policies
create policy task_assignees_select on task_assignees
  for select
  using (
    company_id = (select company_id from profiles where id = auth.uid())
  );

create policy task_assignees_insert on task_assignees
  for insert
  with check (
    company_id = (select company_id from profiles where id = auth.uid())
  );

create policy task_assignees_update on task_assignees
  for update
  using (
    company_id = (select company_id from profiles where id = auth.uid())
  )
  with check (
    company_id = (select company_id from profiles where id = auth.uid())
  );

create policy task_assignees_delete on task_assignees
  for delete
  using (
    company_id = (select company_id from profiles where id = auth.uid())
  );

-- 4. Update tasks RLS policies for update & delete permissions
drop policy if exists tasks_update on tasks;
drop policy if exists tasks_delete on tasks;

-- Any company member assigned, creator, or admin/manager can update task
create policy tasks_update on tasks
  for update
  using (
    company_id = (select company_id from profiles where id = auth.uid())
    and (
      assignee_id = auth.uid()
      or created_by = auth.uid()
      or exists (
        select 1 from task_assignees ta
        where ta.task_id = tasks.id
          and ta.profile_id = auth.uid()
      )
      or exists (
        select 1 from profiles p
        where p.id = auth.uid()
          and p.role in ('admin', 'manager')
      )
    )
  );

-- Admin, manager, or the task creator can delete task
create policy tasks_delete on tasks
  for delete
  using (
    company_id = (select company_id from profiles where id = auth.uid())
    and (
      created_by = auth.uid()
      or exists (
        select 1 from profiles p
        where p.id = auth.uid()
          and p.role in ('admin', 'manager')
      )
    )
  );

-- 5. Backfill existing task assignees into task_assignees junction table
insert into task_assignees (task_id, profile_id, company_id)
select id, assignee_id, company_id
from tasks
where assignee_id is not null
on conflict (task_id, profile_id) do nothing;
