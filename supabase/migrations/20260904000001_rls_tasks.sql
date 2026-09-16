-- ─────────────────────────────────────────────────────────────
-- Phase 6: RLS policies for task_statuses + tasks
-- ─────────────────────────────────────────────────────────────

-- ── task_statuses ─────────────────────────────────────────────

alter table task_statuses enable row level security;

-- Drop existing policies first (idempotent re-runs)
drop policy if exists task_statuses_select on task_statuses;
drop policy if exists task_statuses_insert on task_statuses;
drop policy if exists task_statuses_update on task_statuses;
drop policy if exists task_statuses_delete on task_statuses;

-- All employees in the company can read statuses
create policy task_statuses_select on task_statuses
  for select
  using (
    company_id = (select company_id from profiles where id = auth.uid())
  );

-- Only admin/manager can insert
create policy task_statuses_insert on task_statuses
  for insert
  with check (
    company_id = (select company_id from profiles where id = auth.uid())
    and exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'manager')
    )
  );

-- Only admin/manager can update
create policy task_statuses_update on task_statuses
  for update
  using (
    company_id = (select company_id from profiles where id = auth.uid())
    and exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'manager')
    )
  );

-- Only admin/manager can delete
create policy task_statuses_delete on task_statuses
  for delete
  using (
    company_id = (select company_id from profiles where id = auth.uid())
    and exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'manager')
    )
  );

-- ── tasks ─────────────────────────────────────────────────────

alter table tasks enable row level security;

-- Drop existing policies first (idempotent re-runs)
drop policy if exists tasks_select on tasks;
drop policy if exists tasks_insert on tasks;
drop policy if exists tasks_update on tasks;
drop policy if exists tasks_delete on tasks;

-- All employees in the company can read tasks
create policy tasks_select on tasks
  for select
  using (
    company_id = (select company_id from profiles where id = auth.uid())
  );

-- All employees can create tasks (project membership is implicit via company)
create policy tasks_insert on tasks
  for insert
  with check (
    company_id = (select company_id from profiles where id = auth.uid())
  );

-- Employees can update tasks assigned to them or created by them; admin/manager can update any
create policy tasks_update on tasks
  for update
  using (
    company_id = (select company_id from profiles where id = auth.uid())
    and (
      assignee_id = auth.uid()
      or created_by = auth.uid()
      or exists (
        select 1 from profiles p
        where p.id = auth.uid()
          and p.role in ('admin', 'manager')
      )
    )
  );

-- Only admin/manager can hard-delete tasks
create policy tasks_delete on tasks
  for delete
  using (
    company_id = (select company_id from profiles where id = auth.uid())
    and exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'manager')
    )
  );
