-- MPBP440 V12.0.8: anonymous, session-deduplicated audience analytics.
-- Raw analytics are never exposed to the public API: the SECURITY DEFINER RPCs
-- below enforce the identifiers and write rules before reaching these tables.
create extension if not exists pgcrypto;

create table public.sessions (
  id uuid primary key,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table public.site_visits (
  id bigint generated always as identity primary key,
  session_id uuid not null unique references public.sessions(id) on delete cascade,
  path text not null check (path like '/%'),
  created_at timestamptz not null default now()
);

create table public.video_views (
  id bigint generated always as identity primary key,
  video_id text not null check (video_id in ('l-argent', 'clip-je-sais-que-tu-sais', 'clip-j-existe', 'clip-dois-je-me-taire')),
  session_id uuid not null references public.sessions(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (video_id, session_id)
);

create table public.video_likes (
  id bigint generated always as identity primary key,
  video_id text not null check (video_id in ('l-argent', 'clip-je-sais-que-tu-sais', 'clip-j-existe', 'clip-dois-je-me-taire')),
  session_id uuid not null references public.sessions(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (video_id, session_id)
);

create table public.artist_pages (
  id bigint generated always as identity primary key,
  artist_key text not null check (artist_key in ('sparetdee-simon', 'makeda-muse', 'juste-une-plume')),
  session_id uuid not null references public.sessions(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (artist_key, session_id)
);

create table public.event_views (
  id bigint generated always as identity primary key,
  event_key text not null check (char_length(event_key) between 1 and 120),
  session_id uuid not null references public.sessions(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (event_key, session_id)
);

create table public.analytics_daily (
  day date primary key,
  site_visits bigint not null default 0 check (site_visits >= 0),
  video_views bigint not null default 0 check (video_views >= 0),
  video_likes bigint not null default 0 check (video_likes >= 0),
  updated_at timestamptz not null default now()
);

create index site_visits_created_idx on public.site_visits (created_at desc);
create index video_views_video_created_idx on public.video_views (video_id, created_at desc);
create index video_likes_video_created_idx on public.video_likes (video_id, created_at desc);
create index artist_pages_artist_created_idx on public.artist_pages (artist_key, created_at desc);
create index event_views_event_created_idx on public.event_views (event_key, created_at desc);

alter table public.sessions enable row level security;
alter table public.site_visits enable row level security;
alter table public.video_views enable row level security;
alter table public.video_likes enable row level security;
alter table public.artist_pages enable row level security;
alter table public.event_views enable row level security;
alter table public.analytics_daily enable row level security;

-- The daily aggregate is the sole directly readable public table. There are no
-- direct INSERT/UPDATE/DELETE policies on raw events; mutations use RPC only.
create policy "public read daily analytics" on public.analytics_daily
  for select to anon using (true);

create or replace function public.mpbp_session(p_session uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if p_session is null then raise exception 'session is required'; end if;
  insert into public.sessions (id) values (p_session)
  on conflict (id) do update set last_seen_at = now();
end;
$$;

create or replace function public.increment_site_visit(p_session uuid, p_path text)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare inserted boolean;
begin
  if p_path is null or p_path !~ '^/' or char_length(p_path) > 500 then
    raise exception 'invalid site path';
  end if;
  perform public.mpbp_session(p_session);
  insert into public.site_visits (session_id, path) values (p_session, p_path)
  on conflict (session_id) do nothing returning true into inserted;
  if coalesce(inserted, false) then
    insert into public.analytics_daily (day, site_visits) values (current_date, 1)
    on conflict (day) do update set site_visits = public.analytics_daily.site_visits + 1, updated_at = now();
  end if;
  return coalesce(inserted, false);
end;
$$;

create or replace function public.increment_video_view(p_session uuid, p_video_id text)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare inserted boolean;
begin
  perform public.mpbp_session(p_session);
  insert into public.video_views (session_id, video_id) values (p_session, p_video_id)
  on conflict (video_id, session_id) do nothing returning true into inserted;
  if coalesce(inserted, false) then
    insert into public.analytics_daily (day, video_views) values (current_date, 1)
    on conflict (day) do update set video_views = public.analytics_daily.video_views + 1, updated_at = now();
  end if;
  return coalesce(inserted, false);
end;
$$;

create or replace function public.toggle_video_like(p_session uuid, p_video_id text)
returns boolean
language plpgsql security definer set search_path = public
as $$
begin
  perform public.mpbp_session(p_session);
  if exists (select 1 from public.video_likes where session_id = p_session and video_id = p_video_id) then
    delete from public.video_likes where session_id = p_session and video_id = p_video_id;
    return false;
  end if;
  insert into public.video_likes (session_id, video_id) values (p_session, p_video_id);
  insert into public.analytics_daily (day, video_likes) values (current_date, 1)
  on conflict (day) do update set video_likes = public.analytics_daily.video_likes + 1, updated_at = now();
  return true;
end;
$$;

create or replace function public.increment_artist_visit(p_session uuid, p_artist_key text)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare inserted boolean;
begin
  perform public.mpbp_session(p_session);
  insert into public.artist_pages (session_id, artist_key) values (p_session, p_artist_key)
  on conflict (artist_key, session_id) do nothing returning true into inserted;
  return coalesce(inserted, false);
end;
$$;

create or replace function public.increment_event_visit(p_session uuid, p_event_key text)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare inserted boolean;
begin
  perform public.mpbp_session(p_session);
  insert into public.event_views (session_id, event_key) values (p_session, p_event_key)
  on conflict (event_key, session_id) do nothing returning true into inserted;
  return coalesce(inserted, false);
end;
$$;

create or replace function public.get_video_engagement(p_video_id text)
returns table (views bigint, likes bigint)
language plpgsql security definer set search_path = public
as $$
begin
  if p_video_id not in ('l-argent', 'clip-je-sais-que-tu-sais', 'clip-j-existe', 'clip-dois-je-me-taire') then
    raise exception 'invalid video id';
  end if;
  return query select
    (select count(*) from public.video_views where video_id = p_video_id),
    (select count(*) from public.video_likes where video_id = p_video_id);
end;
$$;

create or replace function public.get_analytics_overview()
returns jsonb
language sql security definer set search_path = public
as $$
  select jsonb_build_object(
    'last_24_hours', jsonb_build_object(
      'visits', (select count(*) from public.site_visits where created_at >= now() - interval '24 hours'),
      'page_views', (select count(*) from public.artist_pages where created_at >= now() - interval '24 hours') + (select count(*) from public.event_views where created_at >= now() - interval '24 hours'),
      'video_views', (select count(*) from public.video_views where created_at >= now() - interval '24 hours'),
      'likes', (select count(*) from public.video_likes where created_at >= now() - interval '24 hours')
    ),
    'last_30_days', jsonb_build_object(
      'visits', (select count(*) from public.site_visits where created_at >= now() - interval '30 days'),
      'page_views', (select count(*) from public.artist_pages where created_at >= now() - interval '30 days') + (select count(*) from public.event_views where created_at >= now() - interval '30 days'),
      'video_views', (select count(*) from public.video_views where created_at >= now() - interval '30 days'),
      'likes', (select count(*) from public.video_likes where created_at >= now() - interval '30 days')
    ),
    'top_artists', coalesce((select jsonb_agg(row_to_json(x)) from (select artist_key, count(*) as visits from public.artist_pages group by artist_key order by visits desc, artist_key limit 10) x), '[]'::jsonb),
    'top_clips', coalesce((select jsonb_agg(row_to_json(x)) from (select video_id, count(*) as views from public.video_views group by video_id order by views desc, video_id limit 10) x), '[]'::jsonb)
  );
$$;

revoke all on all tables in schema public from anon;
revoke all on function public.mpbp_session(uuid), public.increment_site_visit(uuid, text), public.increment_video_view(uuid, text), public.toggle_video_like(uuid, text), public.increment_artist_visit(uuid, text), public.increment_event_visit(uuid, text), public.get_video_engagement(text), public.get_analytics_overview() from public;
grant select on public.analytics_daily to anon;
grant execute on function public.increment_site_visit(uuid, text), public.increment_video_view(uuid, text), public.toggle_video_like(uuid, text), public.increment_artist_visit(uuid, text), public.increment_event_visit(uuid, text), public.get_video_engagement(text), public.get_analytics_overview() to anon;
