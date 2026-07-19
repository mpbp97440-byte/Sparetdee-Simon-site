-- MPBP440 V12.0.9: persistent anonymous visitor likes and per-path visits.
-- A visitor is a random browser UUID, not a personal identifier. Clearing local
-- browser storage or changing device creates a new anonymous visitor.

alter table public.sessions add column if not exists visitor_id uuid;
update public.sessions set visitor_id = id where visitor_id is null;
alter table public.sessions alter column visitor_id set not null;
create index if not exists sessions_visitor_idx on public.sessions (visitor_id);

alter table public.site_visits drop constraint if exists site_visits_session_id_key;
create unique index if not exists site_visits_session_path_key on public.site_visits (session_id, path);

alter table public.video_likes add column if not exists visitor_id uuid;
update public.video_likes set visitor_id = session_id where visitor_id is null;
alter table public.video_likes alter column visitor_id set not null;
alter table public.video_likes drop constraint if exists video_likes_video_id_session_id_key;
create unique index if not exists video_likes_video_visitor_key on public.video_likes (video_id, visitor_id);
create index if not exists video_likes_visitor_idx on public.video_likes (visitor_id, created_at desc);

create or replace function public.mpbp_session(p_session uuid, p_visitor uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if p_session is null or p_visitor is null then
    raise exception 'anonymous session and visitor are required';
  end if;
  insert into public.sessions (id, visitor_id) values (p_session, p_visitor)
  on conflict (id) do update set visitor_id = excluded.visitor_id, last_seen_at = now();
end;
$$;

create or replace function public.increment_site_visit(p_session uuid, p_visitor uuid, p_path text)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare inserted boolean;
begin
  if p_path is null or p_path !~ '^/' or char_length(p_path) > 500 then
    raise exception 'invalid site path';
  end if;
  perform public.mpbp_session(p_session, p_visitor);
  insert into public.site_visits (session_id, path) values (p_session, p_path)
  on conflict (session_id, path) do nothing returning true into inserted;
  if coalesce(inserted, false) then
    insert into public.analytics_daily (day, site_visits) values (current_date, 1)
    on conflict (day) do update set site_visits = public.analytics_daily.site_visits + 1, updated_at = now();
  end if;
  return coalesce(inserted, false);
end;
$$;

create or replace function public.increment_video_view(p_session uuid, p_visitor uuid, p_video_id text)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare inserted boolean;
begin
  perform public.mpbp_session(p_session, p_visitor);
  insert into public.video_views (session_id, video_id) values (p_session, p_video_id)
  on conflict (video_id, session_id) do nothing returning true into inserted;
  if coalesce(inserted, false) then
    insert into public.analytics_daily (day, video_views) values (current_date, 1)
    on conflict (day) do update set video_views = public.analytics_daily.video_views + 1, updated_at = now();
  end if;
  return coalesce(inserted, false);
end;
$$;

create or replace function public.toggle_video_like(p_session uuid, p_visitor uuid, p_video_id text)
returns boolean
language plpgsql security definer set search_path = public
as $$
begin
  perform public.mpbp_session(p_session, p_visitor);
  if exists (select 1 from public.video_likes where visitor_id = p_visitor and video_id = p_video_id) then
    delete from public.video_likes where visitor_id = p_visitor and video_id = p_video_id;
    return false;
  end if;
  insert into public.video_likes (session_id, visitor_id, video_id) values (p_session, p_visitor, p_video_id);
  insert into public.analytics_daily (day, video_likes) values (current_date, 1)
  on conflict (day) do update set video_likes = public.analytics_daily.video_likes + 1, updated_at = now();
  return true;
end;
$$;

create or replace function public.increment_artist_visit(p_session uuid, p_visitor uuid, p_artist_key text)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare inserted boolean;
begin
  perform public.mpbp_session(p_session, p_visitor);
  insert into public.artist_pages (session_id, artist_key) values (p_session, p_artist_key)
  on conflict (artist_key, session_id) do nothing returning true into inserted;
  return coalesce(inserted, false);
end;
$$;

create or replace function public.increment_event_visit(p_session uuid, p_visitor uuid, p_event_key text)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare inserted boolean;
begin
  perform public.mpbp_session(p_session, p_visitor);
  insert into public.event_views (session_id, event_key) values (p_session, p_event_key)
  on conflict (event_key, session_id) do nothing returning true into inserted;
  return coalesce(inserted, false);
end;
$$;

drop function if exists public.get_video_engagement(text);
create function public.get_video_engagement(p_video_id text, p_visitor uuid default null)
returns table (views bigint, likes bigint, liked boolean)
language plpgsql security definer set search_path = public
as $$
begin
  if p_video_id not in ('l-argent', 'clip-je-sais-que-tu-sais', 'clip-j-existe', 'clip-dois-je-me-taire') then
    raise exception 'invalid video id';
  end if;
  return query select
    (select count(*) from public.video_views where video_id = p_video_id),
    (select count(*) from public.video_likes where video_id = p_video_id),
    coalesce((select exists(select 1 from public.video_likes where video_id = p_video_id and visitor_id = p_visitor)), false);
end;
$$;

revoke all on function public.increment_site_visit(uuid, text), public.increment_video_view(uuid, text), public.toggle_video_like(uuid, text), public.increment_artist_visit(uuid, text), public.increment_event_visit(uuid, text) from anon;
revoke all on function public.mpbp_session(uuid), public.mpbp_session(uuid, uuid), public.increment_site_visit(uuid, text), public.increment_site_visit(uuid, uuid, text), public.increment_video_view(uuid, text), public.increment_video_view(uuid, uuid, text), public.toggle_video_like(uuid, text), public.toggle_video_like(uuid, uuid, text), public.increment_artist_visit(uuid, text), public.increment_artist_visit(uuid, uuid, text), public.increment_event_visit(uuid, text), public.increment_event_visit(uuid, uuid, text), public.get_video_engagement(text, uuid) from public;
grant execute on function public.increment_site_visit(uuid, uuid, text), public.increment_video_view(uuid, uuid, text), public.toggle_video_like(uuid, uuid, text), public.increment_artist_visit(uuid, uuid, text), public.increment_event_visit(uuid, uuid, text), public.get_video_engagement(text, uuid) to anon;
