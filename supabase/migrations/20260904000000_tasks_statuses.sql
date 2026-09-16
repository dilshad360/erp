-- ─────────────────────────────────────────────────────────────
-- Phase 6: Task Statuses + Tasks tables
-- ─────────────────────────────────────────────────────────────

-- task_statuses: per-company Kanban columns
create table if not exists task_statuses (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid references companies(id) on delete cascade not null,
  name        text not null,
  color       text,                        -- optional column header color, e.g. '#6366f1'
  sort_order  int not null default 0,
  created_at  timestamptz default now()
);

-- tasks
create table if not exists tasks (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid references companies(id) on delete cascade not null,
  project_id   uuid references projects(id) on delete cascade not null,
  title        text not null,
  description  text,
  status_id    uuid references task_statuses(id) on delete set null,
  priority     text not null default 'medium',  -- 'low' | 'medium' | 'high' | 'urgent'
  assignee_id  uuid references profiles(id) on delete set null,
  due_date     date,
  created_by   uuid references profiles(id) on delete set null,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Keep updated_at current on every update
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tasks_updated_at on tasks;
create trigger tasks_updated_at
  before update on tasks
  for each row execute function update_updated_at();
