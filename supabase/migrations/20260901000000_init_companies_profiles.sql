-- Migration: 20260901000000_init_companies_profiles
-- Creates the core tenant tables: companies and profiles
-- ⚠️ Human review required before running against production

-- ── Companies (tenants) ──────────────────────────────────────────────────────

create table if not exists companies (
  id                 uuid        primary key default gen_random_uuid(),
  name               text        not null,
  slug               text        unique not null,       -- used as subdomain
  gst_number         text,
  office_lat         double precision,
  office_lng         double precision,
  geofence_radius_m  int         default 200,
  brand_color        text        default '#6366f1',     -- hex, overridable per tenant
  logo_url           text,
  custom_domain      text        unique,                -- future: map a custom domain
  created_at         timestamptz default now()
);

comment on table  companies is 'One row per tenant company.';
comment on column companies.slug is 'Lowercase subdomain. Immutable after creation.';
comment on column companies.custom_domain is 'Optional CNAME-mapped domain. Not used in MVP — just reserved.';

-- ── Profiles (extends auth.users) ────────────────────────────────────────────

create table if not exists profiles (
  id                    uuid        primary key references auth.users(id) on delete cascade,
  company_id            uuid        not null references companies(id),
  full_name             text,
  role                  text        not null default 'employee', -- 'admin' | 'manager' | 'employee'
  phone                 text,
  employee_id           text,
  department            text,
  designation           text,
  date_of_joining       date,
  reporting_manager_id  uuid        references profiles(id),
  avatar_url            text,
  is_active             boolean     default true,
  created_at            timestamptz default now()
);

comment on table  profiles is 'Extends auth.users. One profile per user, always belongs to one company.';
comment on column profiles.role is 'Simple role string. Fine-grained permissions are in the roles table (used later).';
comment on column profiles.is_active is 'Soft-delete. False = employee deactivated, cannot log in.';

-- ── Roles (fine-grained, per company) ────────────────────────────────────────
-- Created here so FK references work later; actively used from Phase 7 polish.

create table if not exists roles (
  id           uuid        primary key default gen_random_uuid(),
  company_id   uuid        not null references companies(id),
  role_name    text        not null,
  permissions  jsonb       not null default '{}'::jsonb,
  created_at   timestamptz default now(),
  unique (company_id, role_name)
);

comment on table roles is 'Fine-grained permission sets per company. MVP uses simple profile.role string; this table is for Phase 7+.';

-- ── Indexes ───────────────────────────────────────────────────────────────────

create index if not exists profiles_company_id_idx on profiles(company_id);
create index if not exists profiles_role_idx        on profiles(role);
create index if not exists roles_company_id_idx     on roles(company_id);
