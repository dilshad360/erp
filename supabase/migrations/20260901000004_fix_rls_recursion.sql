-- Migration: 20260901000004_fix_rls_recursion.sql
-- Fixes PostgreSQL error 42P17 (infinite recursion in profiles RLS policy) by using a SECURITY DEFINER helper function.

create or replace function public.get_auth_company_id()
returns uuid
language sql
security definer
stable
as $$
  select company_id from public.profiles where id = auth.uid();
$$;

drop policy if exists "companies: admin can read own company" on companies;
drop policy if exists "profiles: read all in same company" on profiles;

create policy "profiles: read same company"
  on profiles for select
  using (company_id = public.get_auth_company_id());
