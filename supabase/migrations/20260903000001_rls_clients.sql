-- Enable RLS on clients table
alter table clients enable row level security;

-- SELECT policy: all authenticated users can view clients belonging to their company
create policy clients_select on clients
  for select
  using (
    company_id = (select company_id from profiles where id = auth.uid())
  );

-- INSERT policy: only admin and manager can create clients
create policy clients_insert on clients
  for insert
  with check (
    company_id = (select company_id from profiles where id = auth.uid())
    and exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('admin', 'manager')
    )
  );

-- UPDATE policy: only admin and manager can update clients
create policy clients_update on clients
  for update
  using (
    company_id = (select company_id from profiles where id = auth.uid())
    and exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('admin', 'manager')
    )
  );

-- DELETE policy: only admin and manager can delete clients
create policy clients_delete on clients
  for delete
  using (
    company_id = (select company_id from profiles where id = auth.uid())
    and exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('admin', 'manager')
    )
  );
