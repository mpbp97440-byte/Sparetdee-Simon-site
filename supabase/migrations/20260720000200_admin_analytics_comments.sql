-- MPBP440 V12.1: private admin analytics and pre-moderated comments.
create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role = 'admin'),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type = 'clip'),
  content_id text not null check (content_id in ('l-argent','clip-je-sais-que-tu-sais','clip-j-existe','clip-dois-je-me-taire')),
  display_name text not null check (char_length(btrim(display_name)) between 2 and 60),
  message text not null check (char_length(btrim(message)) between 1 and 1000),
  visitor_id uuid not null,
  status text not null default 'pending' check (status in ('pending','approved','hidden','deleted','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  moderated_at timestamptz,
  moderated_by uuid references auth.users(id),
  moderation_note text check (moderation_note is null or char_length(moderation_note) <= 500),
  check ((moderated_at is null and moderated_by is null) or (moderated_at is not null and moderated_by is not null))
);
create index comments_public_idx on public.comments (content_type, content_id, created_at desc) where status = 'approved';
create index comments_moderation_idx on public.comments (status, created_at desc);
create index comments_rate_idx on public.comments (visitor_id, created_at desc);

alter table public.admin_users enable row level security;
alter table public.comments enable row level security;

create or replace function public.is_active_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.admin_users where user_id = auth.uid() and role = 'admin' and is_active); $$;

create or replace function public.require_active_admin()
returns void language plpgsql security definer set search_path = public
as $$ begin if auth.uid() is null or not public.is_active_admin() then raise exception 'administrator access required' using errcode = '42501'; end if; end; $$;

create or replace function public.submit_comment(p_content_type text, p_content_id text, p_display_name text, p_message text, p_visitor uuid)
returns uuid language plpgsql security definer set search_path = public
as $$
declare clean_name text := btrim(p_display_name); clean_message text := btrim(p_message); new_id uuid;
begin
  if p_content_type <> 'clip' or p_content_id not in ('l-argent','clip-je-sais-que-tu-sais','clip-j-existe','clip-dois-je-me-taire') then raise exception 'invalid comment target'; end if;
  if p_visitor is null or char_length(clean_name) not between 2 and 60 or char_length(clean_message) not between 1 and 1000 then raise exception 'invalid comment'; end if;
  if exists(select 1 from public.comments where visitor_id=p_visitor and created_at > now() - interval '30 seconds') then raise exception 'please wait before sending another comment'; end if;
  if (select count(*) from public.comments where visitor_id=p_visitor and created_at > now() - interval '1 hour') >= 5 then raise exception 'comment limit reached'; end if;
  insert into public.comments(content_type,content_id,display_name,message,visitor_id) values('clip',p_content_id,clean_name,clean_message,p_visitor) returning id into new_id;
  return new_id;
end; $$;

create or replace function public.get_approved_comments(p_content_type text, p_content_id text)
returns table(id uuid, content_id text, display_name text, message text, created_at timestamptz)
language sql stable security definer set search_path = public
as $$ select id, content_id, display_name, message, created_at from public.comments where status='approved' and content_type=p_content_type and content_id=p_content_id order by created_at desc limit 100; $$;

create or replace function public.get_admin_dashboard_summary()
returns jsonb language plpgsql stable security definer set search_path = public
as $$ begin perform public.require_active_admin(); return jsonb_build_object(
    'visits_today',(select count(*) from public.site_visits where created_at >= current_date),
    'visits_7_days',(select count(*) from public.site_visits where created_at >= now()-interval '7 days'),
    'visits_30_days',(select count(*) from public.site_visits where created_at >= now()-interval '30 days'),
    'visits_total',(select count(*) from public.site_visits),
    'pending_comments',(select count(*) from public.comments where status='pending'),
    'last_activity',(select max(created_at) from (select created_at from public.site_visits union all select created_at from public.video_views union all select created_at from public.comments) a)
  ); end;
$$;

create or replace function public.get_admin_clip_stats()
returns table(video_id text, views bigint, likes bigint)
language plpgsql stable security definer set search_path = public
as $$ begin perform public.require_active_admin(); return query select v0.video_id, count(distinct v.id), count(distinct l.id) from (values ('l-argent'::text),('clip-je-sais-que-tu-sais'),('clip-j-existe'),('clip-dois-je-me-taire')) v0(video_id) left join public.video_views v on v.video_id=v0.video_id left join public.video_likes l on l.video_id=v0.video_id group by v0.video_id order by count(distinct v.id) desc, count(distinct l.id) desc; end; $$;

create or replace function public.get_admin_artist_stats()
returns table(artist_key text, visits bigint)
language plpgsql stable security definer set search_path = public
as $$ begin perform public.require_active_admin(); return query select a.artist_key,count(p.id) from (values ('sparetdee-simon'::text),('makeda-muse'),('juste-une-plume')) a(artist_key) left join public.artist_pages p on p.artist_key=a.artist_key group by a.artist_key order by count(p.id) desc; end; $$;

create or replace function public.get_admin_page_stats()
returns table(path text, visits bigint)
language plpgsql stable security definer set search_path = public
as $$ begin perform public.require_active_admin(); return query select s.path,count(*) from public.site_visits s group by s.path order by count(*) desc,s.path limit 50; end; $$;

create or replace function public.get_admin_recent_activity()
returns table(kind text, occurred_at timestamptz)
language plpgsql stable security definer set search_path = public
as $$ begin perform public.require_active_admin(); return query select a.kind,a.occurred_at from (select 'visit'::text kind,created_at occurred_at from public.site_visits union all select 'video view',created_at from public.video_views union all select 'comment',created_at from public.comments) a order by a.occurred_at desc limit 50; end; $$;

create or replace function public.admin_list_comments(p_status text default 'pending')
returns table(id uuid, content_id text, display_name text, message text, status text, created_at timestamptz, moderated_at timestamptz)
language plpgsql security definer set search_path = public
as $$ begin perform public.require_active_admin(); if p_status not in ('pending','approved','hidden','deleted','rejected','all') then raise exception 'invalid status'; end if; return query select c.id,c.content_id,c.display_name,c.message,c.status,c.created_at,c.moderated_at from public.comments c where p_status='all' or c.status=p_status order by c.created_at desc limit 200; end; $$;

create or replace function public.admin_moderate_comment(p_comment_id uuid, p_new_status text, p_note text default null)
returns boolean language plpgsql security definer set search_path = public
as $$ begin perform public.require_active_admin(); if p_new_status not in ('approved','hidden','rejected','pending') then raise exception 'invalid moderation status'; end if; update public.comments set status=p_new_status,moderated_at=now(),moderated_by=auth.uid(),moderation_note=nullif(btrim(p_note),'') ,updated_at=now() where id=p_comment_id; if not found then raise exception 'comment not found'; end if; return true; end; $$;

create or replace function public.admin_delete_comment(p_comment_id uuid)
returns boolean language plpgsql security definer set search_path = public
as $$ begin perform public.require_active_admin(); update public.comments set status='deleted',moderated_at=now(),moderated_by=auth.uid(),updated_at=now() where id=p_comment_id; if not found then raise exception 'comment not found'; end if; return true; end; $$;

revoke all on public.admin_users, public.comments from anon, authenticated;
revoke all on function public.is_active_admin(), public.require_active_admin(), public.get_admin_dashboard_summary(), public.get_admin_clip_stats(), public.get_admin_artist_stats(), public.get_admin_page_stats(), public.get_admin_recent_activity(), public.admin_list_comments(text), public.admin_moderate_comment(uuid,text,text), public.admin_delete_comment(uuid) from public, anon, authenticated;
revoke all on function public.submit_comment(text,text,text,text,uuid), public.get_approved_comments(text,text) from public;
grant execute on function public.submit_comment(text,text,text,text,uuid), public.get_approved_comments(text,text) to anon;
grant execute on function public.get_admin_dashboard_summary(), public.get_admin_clip_stats(), public.get_admin_artist_stats(), public.get_admin_page_stats(), public.get_admin_recent_activity(), public.admin_list_comments(text), public.admin_moderate_comment(uuid,text,text), public.admin_delete_comment(uuid) to authenticated;
