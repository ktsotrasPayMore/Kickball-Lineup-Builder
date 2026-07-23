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

-- Persistent shared teams use separate unguessable viewer and editor secrets.
-- Only security-definer functions below can access this table.
create extension if not exists pgcrypto;
create table if not exists public.shared_teams (
  share_id uuid primary key,
  edit_token_hash bytea not null,
  view_token_hash bytea not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- These tables preserve all-time counters when the recent-event list is
-- cleared. The registry also determines whether a browser is truly new.
create table if not exists public.visitor_totals (
  id boolean primary key default true check (id),
  total_visits bigint not null default 0,
  unique_visitors bigint not null default 0
);

create table if not exists public.visitor_registry (
  browser_id uuid primary key,
  first_visited_at timestamptz not null default now(),
  last_recorded_at timestamptz not null default now()
);

alter table public.visitor_registry add column if not exists last_recorded_at timestamptz not null default now();

-- Seed counters when upgrading an installation that already has events.
insert into public.visitor_registry (browser_id, first_visited_at, last_recorded_at)
select browser_id, min(visited_at), max(visited_at) from public.visitor_events group by browser_id
on conflict (browser_id) do update set
  first_visited_at = least(visitor_registry.first_visited_at, excluded.first_visited_at),
  last_recorded_at = greatest(visitor_registry.last_recorded_at, excluded.last_recorded_at);

insert into public.visitor_totals (id, total_visits, unique_visitors)
select true, count(*), count(distinct browser_id) from public.visitor_events
on conflict (id) do nothing;

alter table public.visitor_events enable row level security;
alter table public.roster_snapshots enable row level security;
alter table public.shared_teams enable row level security;
alter table public.admin_users enable row level security;
alter table public.visitor_totals enable row level security;
alter table public.visitor_registry enable row level security;

-- Dropping these first makes this setup script safe to run again if setup was
-- interrupted or a policy already exists.
drop policy if exists "anonymous visitors can be recorded" on public.visitor_events;
drop policy if exists "anonymous snapshots can be created" on public.roster_snapshots;
drop policy if exists "admins can read visits" on public.visitor_events;
drop policy if exists "admins can read snapshots" on public.roster_snapshots;
drop policy if exists "admins can delete visits" on public.visitor_events;
drop policy if exists "admins can delete snapshots" on public.roster_snapshots;
drop policy if exists "admins can read their authorization" on public.admin_users;
drop policy if exists "admins can read visitor totals" on public.visitor_totals;

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
create policy "admins can read visitor totals" on public.visitor_totals
  for select to authenticated using (exists (select 1 from public.admin_users where user_id = auth.uid()));

create index if not exists visitor_events_visited_at_idx on public.visitor_events (visited_at desc);
create index if not exists roster_snapshots_updated_at_idx on public.roster_snapshots (updated_at desc);
create index if not exists shared_teams_updated_at_idx on public.shared_teams (updated_at desc);

create or replace function public.create_shared_team(p_share_id uuid, p_edit_token text, p_view_token text, p_payload jsonb)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if length(p_edit_token) < 32 or length(p_view_token) < 32 or p_payload is null then raise exception 'Invalid shared team'; end if;
  insert into public.shared_teams (share_id, edit_token_hash, view_token_hash, payload)
  values (p_share_id, digest(p_edit_token, 'sha256'), digest(p_view_token, 'sha256'), p_payload);
end; $$;

create or replace function public.get_shared_team(p_share_id uuid, p_access_token text)
returns table(payload jsonb, updated_at timestamptz, can_edit boolean)
language sql security definer set search_path = public, extensions as $$
  select s.payload, s.updated_at, s.edit_token_hash = digest(p_access_token, 'sha256')
  from public.shared_teams s
  where s.share_id = p_share_id
    and (s.edit_token_hash = digest(p_access_token, 'sha256') or s.view_token_hash = digest(p_access_token, 'sha256'));
$$;

create or replace function public.update_shared_team(p_share_id uuid, p_edit_token text, p_payload jsonb)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  update public.shared_teams set payload = p_payload, updated_at = now()
  where share_id = p_share_id and edit_token_hash = digest(p_edit_token, 'sha256');
  if not found then raise exception 'Shared team not found'; end if;
end; $$;

revoke all on function public.create_shared_team(uuid, text, text, jsonb) from public;
revoke all on function public.get_shared_team(uuid, text) from public;
revoke all on function public.update_shared_team(uuid, text, jsonb) from public;
grant execute on function public.create_shared_team(uuid, text, text, jsonb) to anon;
grant execute on function public.get_shared_team(uuid, text) to anon;
grant execute on function public.update_shared_team(uuid, text, jsonb) to anon;

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
  new_visitor boolean;
begin
  if p_page_path = '/admin.html' then
    return;
  end if;

  -- Serialize visits from this browser and suppress repeat page loads for five
  -- minutes so one visitor does not fill the recent-visitors list.
  perform pg_advisory_xact_lock(hashtextextended(p_browser_id::text, 0));
  if exists (
    select 1 from public.visitor_registry
    where browser_id = p_browser_id
      and last_recorded_at > now() - interval '5 minutes'
  ) then
    return;
  end if;
  new_visitor := not exists (select 1 from public.visitor_registry where browser_id = p_browser_id);

  client_ip := coalesce(
    nullif(request_headers ->> 'cf-connecting-ip', ''),
    nullif(btrim(split_part(request_headers ->> 'x-forwarded-for', ',', 1)), ''),
    nullif(request_headers ->> 'x-real-ip', '')
  );

  insert into public.visitor_events (browser_id, page_path, referrer, user_agent, ip_address)
  values (p_browser_id, p_page_path, p_referrer, p_user_agent, client_ip);

  insert into public.visitor_registry (browser_id) values (p_browser_id)
  on conflict (browser_id) do update set last_recorded_at = now();

  insert into public.visitor_totals (id, total_visits, unique_visitors)
  values (true, 1, case when new_visitor then 1 else 0 end)
  on conflict (id) do update set
    total_visits = visitor_totals.total_visits + 1,
    unique_visitors = visitor_totals.unique_visitors + excluded.unique_visitors;
end;
$$;

revoke all on function public.record_visitor_event(uuid, text, text, text) from public;
grant execute on function public.record_visitor_event(uuid, text, text, text) to anon;

-- After creating the administrator in Authentication > Users, run this with
-- that user's UUID (not their password):
-- insert into public.admin_users (user_id) values ('USER-UUID-HERE');
