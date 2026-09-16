-- Clients table schema
create table clients (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid references companies(id) not null,
  name            text not null,
  contact_person  text,
  email           text,
  phone           text,
  address         text,
  gst_number      text,
  notes           text,
  status          text not null default 'active', -- 'active' | 'inactive'
  created_at      timestamptz not null default now()
);

-- Performance indexes for tenant queries
create index idx_clients_company_id on clients(company_id);
create index idx_clients_company_status on clients(company_id, status);
