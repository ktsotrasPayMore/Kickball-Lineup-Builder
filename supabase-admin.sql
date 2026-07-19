-- Create the admin under Authentication > Users, then run this once in the
-- Supabase SQL editor. Do not put an admin password in this repository.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table if not exists public.visitor_events (
  id bigint generated always as identity primary key,
  browser_id uuid not null,
  visited_at timestamptz not null default now(),
  page_path text not null,
  referrer text,
  user_agent text
);

create table if not exists public.roster_snapshots (
  id bigint generated always as identity primary key,
  browser_id uuid not null,
  payload jsonb not null,
  team_count integer not null default 0,
  lineup_count integer not null default 0,
  player_count integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.visitor_events enable row level security;
alter table public.roster_snapshots enable row level security;
alter table public.admin_users enable row level security;

create policy "anonymous visitors can be recorded" on public.visitor_events
  for insert to anon with check (page_path <> '/admin.html');
create policy "anonymous snapshots can be created" on public.roster_snapshots
  for insert to anon with check (true);
create policy "admins can read visits" on public.visitor_events
  for select to authenticated using (exists (select 1 from public.admin_users where user_id = auth.uid()));
create policy "admins can read snapshots" on public.roster_snapshots
  for select to authenticated using (exists (select 1 from public.admin_users where user_id = auth.uid()));
create policy "admins can read their authorization" on public.admin_users
  for select to authenticated using (user_id = auth.uid());

create index if not exists visitor_events_visited_at_idx on public.visitor_events (visited_at desc);
create index if not exists roster_snapshots_updated_at_idx on public.roster_snapshots (updated_at desc);

-- After creating the administrator in Authentication > Users, run this with
-- that user's UUID (not their password):
-- insert into public.admin_users (user_id) values ('USER-UUID-HERE');
