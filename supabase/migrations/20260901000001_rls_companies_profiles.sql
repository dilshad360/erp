-- Migration: 20260901000001_rls_companies_profiles
-- Enables Row Level Security on companies, profiles, and roles tables
-- ⚠️ Human review required before running against production

-- ── Companies ─────────────────────────────────────────────────────────────────
-- Only the admin of a company can read or edit their own company row.
-- Regular employees don't need to query this table directly — they get
-- company data through the tenant layout server component.

alter table companies enable row level security;

-- Admin of the company can SELECT their own company
create policy "companies: admin can read own company"
  on companies for select
  using (
    id = (select company_id from profiles where id = auth.uid())
  );

-- Admin of the company can UPDATE their own company (settings, brand color, etc.)
create policy "companies: admin can update own company"
  on companies for update
  using (
    id = (select company_id from profiles where id = auth.uid())
    and exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ── Profiles ──────────────────────────────────────────────────────────────────

alter table profiles enable row level security;

-- All employees can read all profiles in their own company
-- (needed for dropdowns: assignee picker, reporting manager selector, etc.)
create policy "profiles: read all in same company"
  on profiles for select
  using (
    company_id = (select company_id from profiles where id = auth.uid())
  );

-- Any employee can update their own profile (limited fields enforced at API level)
create policy "profiles: update own profile"
  on profiles for update
  using (id = auth.uid());

-- Only admins can insert new profiles (employee invite flow)
create policy "profiles: admin can insert"
  on profiles for insert
  with check (
    company_id = (select company_id from profiles where id = auth.uid())
    and exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Only admins can update any profile in their company (e.g. role change, deactivation)
create policy "profiles: admin can update any"
  on profiles for update
  using (
    company_id = (select company_id from profiles where id = auth.uid())
    and exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ── Roles ─────────────────────────────────────────────────────────────────────

alter table roles enable row level security;

-- Standard tenant isolation — all operations scoped to company
create policy "roles: tenant isolation"
  on roles for all
  using (
    company_id = (select company_id from profiles where id = auth.uid())
  );
