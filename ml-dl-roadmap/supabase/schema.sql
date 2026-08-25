# ML Engineer Launchpad — optional Supabase schema
# Local persistence works without configuring Supabase.
# When ready, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then apply this SQL.

create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  state jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists evidence_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  evidence_id text not null,
  file_name text not null,
  content_type text,
  size_bytes integer,
  storage_path text,
  visibility text not null default 'private',
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table app_state enable row level security;
alter table evidence_files enable row level security;

create policy "Users manage own profiles"
  on profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own app state"
  on app_state for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own evidence metadata"
  on evidence_files for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
