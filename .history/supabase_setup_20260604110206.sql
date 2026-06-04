-- =================================================================================
-- Supabase Schema Setup Script for 999FM — Juice WRLD Community Vault
-- Paste this script into your Supabase Dashboard SQL Editor to set up tables & RLS
-- =================================================================================

-- 1. Create the 'uploads' table for community audio contributions
create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  song_api_id integer not null,
  song_name text not null,
  era_name text,
  category text,
  audio_url text not null,
  file_name text not null,
  file_size bigint,
  duration integer,
  uploader_id uuid references auth.users(id) on delete set null,
  uploader_name text,
  upload_date timestamptz default now(),
  play_count integer default 0,
  download_count integer default 0,
  quality text,
  notes text,
  status text default 'active'
);

-- 2. Create the 'likes' table for tracking liked tracks
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  song_api_id integer not null,
  unique(user_id, song_api_id)
);

-- 3. Enable Row Level Security (RLS) on both tables
alter table public.uploads enable row level security;
alter table public.likes enable row level security;

-- 4. Set up Policies for the 'uploads' table
-- Allow anyone to select active uploads
drop policy if exists "Allow public select for active uploads" on public.uploads;
create policy "Allow public select for active uploads" on public.uploads
  for select
  to anon, authenticated
  using (status = 'active');

-- Allow authenticated users to upload new audio files
drop policy if exists "Allow authenticated insert for uploads" on public.uploads;
create policy "Allow authenticated insert for uploads" on public.uploads
  for insert
  to authenticated
  with check (auth.uid() = uploader_id);

-- Allow anyone to update play_count and download_count
drop policy if exists "Allow public update of play/download counts" on public.uploads;
create policy "Allow public update of play/download counts" on public.uploads
  for update
  to anon, authenticated
  using (true)
  with check (true);

-- 5. Set up Policies for the 'likes' table
-- Allow authenticated users to view their own liked tracks
drop policy if exists "Allow user select for own likes" on public.likes;
create policy "Allow user select for own likes" on public.likes
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Allow authenticated users to add liked tracks
drop policy if exists "Allow user insert for own likes" on public.likes;
create policy "Allow user insert for own likes" on public.likes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Allow authenticated users to delete/unlike their tracks
drop policy if exists "Allow user delete for own likes" on public.likes;
create policy "Allow user delete for own likes" on public.likes
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- 6. Grant access to API roles (Data API settings)
grant usage on schema public to anon, authenticated, service_role;
grant all on public.uploads to anon, authenticated, service_role;
grant all on public.likes to anon, authenticated, service_role;

-- 7. Storage bucket and policies for the built-in songs bucket player
insert into storage.buckets (id, name, public)
values ('songs', 'songs', false)
on conflict (id) do update set name = excluded.name;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Allow public read for songs bucket'
  ) then
    create policy "Allow public read for songs bucket" on storage.objects
      for select
      to anon, authenticated
      using (bucket_id = 'songs');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Allow authenticated uploads to songs bucket'
  ) then
    create policy "Allow authenticated uploads to songs bucket" on storage.objects
      for insert
      to authenticated
      with check (bucket_id = 'songs');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Allow authenticated updates to songs bucket'
  ) then
    create policy "Allow authenticated updates to songs bucket" on storage.objects
      for update
      to authenticated
      using (bucket_id = 'songs')
      with check (bucket_id = 'songs');
  end if;
end $$;
