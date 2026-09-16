-- Migration: 20260905000000_storage_logos
-- Sets up public storage bucket for company logos and upload policies

-- Insert 'logos' bucket if it doesn't already exist
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

-- Policy: Anyone can read logos (public access)
drop policy if exists "logos: public read access" on storage.objects;
create policy "logos: public read access"
  on storage.objects for select
  using (bucket_id = 'logos');

-- Policy: Authenticated users can upload logos
drop policy if exists "logos: authenticated upload" on storage.objects;
create policy "logos: authenticated upload"
  on storage.objects for insert
  with check (
    bucket_id = 'logos'
    and auth.role() = 'authenticated'
  );

-- Policy: Authenticated users can update or delete logos
drop policy if exists "logos: authenticated update delete" on storage.objects;
create policy "logos: authenticated update delete"
  on storage.objects for update
  using (
    bucket_id = 'logos'
    and auth.role() = 'authenticated'
  );
