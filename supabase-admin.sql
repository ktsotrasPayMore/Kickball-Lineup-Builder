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
  user_agent text,
  ip_address text
);

-- Add the IP column when upgrading an existing reporting database.
alter table public.visitor_events add column if not exists ip_address text;

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

-- Dropping these first makes this setup script safe to run again if setup was
-- interrupted or a policy already exists.
drop policy if exists "anonymous visitors can be recorded" on public.visitor_events;
drop policy if exists "anonymous snapshots can be created" on public.roster_snapshots;
drop policy if exists "admins can read visits" on public.visitor_events;
drop policy if exists "admins can read snapshots" on public.roster_snapshots;
drop policy if exists "admins can delete visits" on public.visitor_events;
drop policy if exists "admins can delete snapshots" on public.roster_snapshots;
drop policy if exists "admins can read their authorization" on public.admin_users;

create policy "anonymous snapshots can be created" on public.roster_snapshots
  for insert to anon with check (true);
create policy "admins can read visits" on public.visitor_events
  for select to authenticated using (exists (select 1 from public.admin_users where user_id = auth.uid()));
create policy "admins can read snapshots" on public.roster_snapshots
  for select to authenticated using (exists (select 1 from public.admin_users where user_id = auth.uid()));
create policy "admins can delete visits" on public.visitor_events
  for delete to authenticated using (exists (select 1 from public.admin_users where user_id = auth.uid()));
create policy "admins can delete snapshots" on public.roster_snapshots
  for delete to authenticated using (exists (select 1 from public.admin_users where user_id = auth.uid()));
create policy "admins can read their authorization" on public.admin_users
  for select to authenticated using (user_id = auth.uid());

create index if not exists visitor_events_visited_at_idx on public.visitor_events (visited_at desc);
create index if not exists roster_snapshots_updated_at_idx on public.roster_snapshots (updated_at desc);

-- Record visits through a database function so the IP comes from Supabase's
-- trusted request headers rather than from user-controlled browser data.
create or replace function public.record_visitor_event(
  p_browser_id uuid,
  p_page_path text,
  p_referrer text,
  p_user_agent text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  request_headers jsonb := coalesce(nullif(current_setting('request.headers', true), '')::jsonb, '{}'::jsonb);
  client_ip text;
begin
  if p_page_path = '/admin.html' then
    return;
  end if;

  client_ip := coalesce(
    nullif(request_headers ->> 'cf-connecting-ip', ''),
    nullif(btrim(split_part(request_headers ->> 'x-forwarded-for', ',', 1)), ''),
    nullif(request_headers ->> 'x-real-ip', '')
  );

  insert into public.visitor_events (browser_id, page_path, referrer, user_agent, ip_address)
  values (p_browser_id, p_page_path, p_referrer, p_user_agent, client_ip);
end;
$$;

revoke all on function public.record_visitor_event(uuid, text, text, text) from public;
grant execute on function public.record_visitor_event(uuid, text, text, text) to anon;

-- After creating the administrator in Authentication > Users, run this with
-- that user's UUID (not their password):
-- insert into public.admin_users (user_id) values ('USER-UUID-HERE');
