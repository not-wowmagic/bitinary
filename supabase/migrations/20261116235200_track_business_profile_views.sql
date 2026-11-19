create table if not exists public.business_profile_viewers_daily (
  business_id uuid not null references public.businesses(id) on delete cascade,
  viewer_id uuid not null references public.profiles(id) on delete cascade,
  viewed_on date not null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (business_id, viewer_id, viewed_on)
);

alter table public.business_profile_viewers_daily enable row level security;
revoke all on table public.business_profile_viewers_daily from anon, authenticated;

create or replace function public.track_business_profile_view(p_business_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_viewer_id uuid := auth.uid();
  v_viewed_on date := (timezone('utc', now()))::date;
  v_inserted_count integer;
begin
  if v_viewer_id is null then
    return false;
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = v_viewer_id
      and p.role = 'traveler'
  ) then
    return false;
  end if;

  if not exists (
    select 1
    from public.businesses b
    where b.id = p_business_id
      and b.live = true
      and b.verification_status = 'verified'
      and b.owner_id <> v_viewer_id
  ) then
    return false;
  end if;

  insert into public.business_profile_viewers_daily (business_id, viewer_id, viewed_on)
  values (p_business_id, v_viewer_id, v_viewed_on)
  on conflict do nothing;

  get diagnostics v_inserted_count = row_count;
  if v_inserted_count = 0 then
    return false;
  end if;

  insert into public.business_daily_stats (business_id, stat_date, views)
  values (p_business_id, v_viewed_on, 1)
  on conflict (business_id, stat_date)
  do update set views = public.business_daily_stats.views + 1;

  return true;
end;
$$;

revoke all on function public.track_business_profile_view(uuid) from public, anon;
grant execute on function public.track_business_profile_view(uuid) to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'business_daily_stats'
  ) then
    alter publication supabase_realtime add table public.business_daily_stats;
  end if;
end $$;
