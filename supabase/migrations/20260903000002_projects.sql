-- Projects table schema
create table projects (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid references companies(id) not null,
  client_id    uuid references clients(id) not null,
  name         text not null,
  description  text,
  status       text not null default 'active', -- 'active' | 'on_hold' | 'completed' | 'cancelled'
  start_date   date,
  end_date     date,
  budget       numeric,
  created_by   uuid references profiles(id),
  created_at   timestamptz not null default now()
);

-- Performance indexes for tenant queries
create index idx_projects_company_id on projects(company_id);
create index idx_projects_company_status on projects(company_id, status);
create index idx_projects_client_id on projects(client_id);
