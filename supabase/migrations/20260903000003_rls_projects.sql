-- Enable RLS on projects table
alter table projects enable row level security;

-- SELECT policy: all authenticated users can view projects belonging to their company
create policy projects_select on projects
  for select
  using (
    company_id = (select company_id from profiles where id = auth.uid())
  );

-- INSERT policy: only admin and manager can create projects
create policy projects_insert on projects
  for insert
  with check (
    company_id = (select company_id from profiles where id = auth.uid())
    and exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('admin', 'manager')
    )
  );

-- UPDATE policy: only admin and manager can update projects
create policy projects_update on projects
  for update
  using (
    company_id = (select company_id from profiles where id = auth.uid())
    and exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('admin', 'manager')
    )
  );

-- DELETE policy: only admin and manager can delete/cancel projects
create policy projects_delete on projects
  for delete
  using (
    company_id = (select company_id from profiles where id = auth.uid())
    and exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('admin', 'manager')
    )
  );
