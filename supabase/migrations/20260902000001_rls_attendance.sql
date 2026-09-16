-- Migration: 20260902000001_rls_attendance.sql
-- RLS policies for the attendance_logs table.
-- Uses public.get_auth_company_id() from migration 20260901000004 to avoid recursion.

alter table attendance_logs enable row level security;

-- ── Policy 1: Standard tenant isolation (INSERT / UPDATE / DELETE) ──────────
-- All write operations are restricted to rows belonging to the same company.
create policy "attendance: tenant isolation"
  on attendance_logs
  for all
  using (company_id = public.get_auth_company_id())
  with check (company_id = public.get_auth_company_id());

-- ── Policy 2: Role-aware SELECT ──────────────────────────────────────────────
-- Employees can only read their own rows.
-- Admins and managers can read all rows within their company.
-- (This SELECT policy takes precedence over the ALL policy for reads
--  because PostgreSQL evaluates USING expressions per operation.)
drop policy if exists "attendance: tenant isolation" on attendance_logs;

-- Re-create as separate policies per operation for clarity:

create policy "attendance: insert own company"
  on attendance_logs
  for insert
  with check (company_id = public.get_auth_company_id());

create policy "attendance: update own company"
  on attendance_logs
  for update
  using (company_id = public.get_auth_company_id())
  with check (company_id = public.get_auth_company_id());

create policy "attendance: delete own company"
  on attendance_logs
  for delete
  using (company_id = public.get_auth_company_id());

-- Role-aware SELECT: employee sees own rows; admin/manager sees all in company
create policy "attendance: role-aware select"
  on attendance_logs
  for select
  using (
    -- Employee sees only their own rows
    user_id = auth.uid()
    or
    -- Admin or manager sees all rows in their company
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.company_id = attendance_logs.company_id
        and p.role in ('admin', 'manager')
    )
  );
