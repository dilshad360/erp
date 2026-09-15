-- Migration: 20260901000003_companies_public_select.sql
-- Allow public select on companies so subdomain routing middleware and login page can resolve tenant metadata.

create policy "companies: public slug lookup"
  on companies for select
  using (true);
