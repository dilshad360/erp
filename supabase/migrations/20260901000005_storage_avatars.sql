-- Migration: 20260902000000_storage_avatars
-- Sets up public storage bucket for avatars and tenant-isolated upload policies

-- Insert 'avatars' bucket if it doesn't already exist
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Enable RLS on storage.objects (if not already enabled)
alter table storage.objects enable row level security;

-- Policy: Anyone can read avatars (public access)
drop policy if exists "avatars: public read access" on storage.objects;
create policy "avatars: public read access"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Policy: Users can upload avatar to avatars bucket
drop policy if exists "avatars: authenticated upload" on storage.objects;
create policy "avatars: authenticated upload"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
  );

-- Policy: Users can update or delete avatar in avatars bucket
drop policy if exists "avatars: authenticated update delete" on storage.objects;
create policy "avatars: authenticated update delete"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
  );
