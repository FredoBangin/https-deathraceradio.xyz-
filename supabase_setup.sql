-- =================================================================================
-- Supabase Schema Setup Script for 999FM — Juice WRLD Community Vault
-- Paste this script into your Supabase Dashboard SQL Editor to set up tables & RLS
-- =================================================================================

--
-- Auth Dashboard checklist before production:
-- 1. Auth > Providers > Email: enable Email provider.
-- 2. Auth > Providers > Email: enable Secure email change.
-- 3. Auth > Providers > Email: enable Secure password change.
-- 4. Auth > Providers > Email: enable Require current password when updating.
-- 5. Auth > Password Security: enable Prevent use of leaked passwords.
-- 6. Auth > Password Security: require at least 8 chars, uppercase, lowercase, number, and symbol.
--
-- These Auth provider settings cannot be fully enabled from this SQL schema script.

-- 1. Create the 'likes' table for tracking liked tracks
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  song_api_id integer not null,
  unique(user_id, song_api_id)
);

-- 2. Create public profile rows for display names and comments
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  username text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Create track comments
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  song_api_id integer not null,
  song_name text not null,
  user_id uuid references auth.users(id) on delete set null,
  author_name text not null,
  body text not null,
  comment_time_seconds integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  status text default 'active'
);

-- 4. Enable Row Level Security (RLS) on exposed tables
alter table public.likes enable row level security;
alter table public.profiles enable row level security;
alter table public.comments enable row level security;

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

-- 6. Set up Policies for the 'profiles' table
-- Allow anyone to read public display profile data
drop policy if exists "Allow public select for profiles" on public.profiles;
create policy "Allow public select for profiles" on public.profiles
  for select
  to anon, authenticated
  using (true);

-- Allow authenticated users to create their own profile row
drop policy if exists "Allow user insert for own profile" on public.profiles;
create policy "Allow user insert for own profile" on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

-- Allow authenticated users to update their own profile row
drop policy if exists "Allow user update for own profile" on public.profiles;
create policy "Allow user update for own profile" on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- 7. Set up Policies for the 'comments' table
-- Allow anyone to read active comments
drop policy if exists "Allow public select for active comments" on public.comments;
create policy "Allow public select for active comments" on public.comments
  for select
  to anon, authenticated
  using (status = 'active');

-- Allow authenticated users to create their own comments
drop policy if exists "Allow user insert for own comments" on public.comments;
create policy "Allow user insert for own comments" on public.comments
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- Allow authenticated users to edit their own comments
drop policy if exists "Allow user update for own comments" on public.comments;
create policy "Allow user update for own comments" on public.comments
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 8. Grant access to API roles (Data API settings)
grant usage on schema public to anon, authenticated, service_role;
grant all on public.likes to anon, authenticated, service_role;
grant all on public.profiles to anon, authenticated, service_role;
grant select on public.comments to anon;
grant select, insert, update on public.comments to authenticated;
grant all on public.comments to service_role;

-- 9. Storage bucket and policies for the built-in songs bucket player
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
      and policyname = 'Allow authenticated writes to songs bucket'
  ) then
    create policy "Allow authenticated writes to songs bucket" on storage.objects
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
