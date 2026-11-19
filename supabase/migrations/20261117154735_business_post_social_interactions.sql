create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (post_id, user_id)
);

alter table public.post_likes enable row level security;

revoke all on public.post_likes from public, anon, authenticated;
grant select, insert, delete on public.post_likes to authenticated;

drop policy if exists "Users view own post likes" on public.post_likes;
create policy "Users view own post likes" on public.post_likes
for select to authenticated using (user_id = auth.uid());

drop policy if exists "Users create post likes" on public.post_likes;
create policy "Users create post likes" on public.post_likes
for insert to authenticated with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'traveler'
  )
  and exists (
    select 1
    from public.posts post
    join public.businesses b on b.id = post.business_id
    where post.id = post_likes.post_id
      and post.status = 'published'
      and b.live = true
      and b.verification_status = 'verified'
  )
);

drop policy if exists "Users delete own post likes" on public.post_likes;
create policy "Users delete own post likes" on public.post_likes
for delete to authenticated using (user_id = auth.uid());

grant select on public.comments to anon, authenticated;
grant insert, update on public.comments to authenticated;

drop policy if exists "Users create comments" on public.comments;
create policy "Users create comments" on public.comments
for insert to authenticated with check (
  author_id = auth.uid()
  and hidden = false
  and blocked = false
  and reply is null
  and length(trim(body)) between 1 and 2000
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'traveler'
  )
  and exists (
    select 1
    from public.posts post
    join public.businesses b on b.id = post.business_id
    where post.id = comments.post_id
      and post.status = 'published'
      and b.live = true
      and b.verification_status = 'verified'
  )
);

create or replace function public.update_post_social_counts()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_post_id uuid;
begin
  if tg_table_name = 'post_likes' then
    target_post_id := case when tg_op = 'DELETE' then old.post_id else new.post_id end;
    update public.posts
    set likes = greatest(0, likes + case when tg_op = 'DELETE' then -1 else 1 end)
    where id = target_post_id;
  else
    target_post_id := case when tg_op = 'DELETE' then old.post_id else new.post_id end;
    update public.posts
    set comments_count = greatest(
      0,
      comments_count + case when tg_op = 'DELETE' then -1 else 1 end
    )
    where id = target_post_id;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists post_likes_update_social_counts on public.post_likes;
create trigger post_likes_update_social_counts
after insert or delete on public.post_likes
for each row execute function public.update_post_social_counts();

drop trigger if exists comments_update_social_counts on public.comments;
create trigger comments_update_social_counts
after insert or delete on public.comments
for each row execute function public.update_post_social_counts();

drop policy if exists "Travelers view live business images" on storage.objects;
create policy "Travelers view live business images"
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'images'
  and exists (
    select 1
    from public.businesses b
    where b.live = true
      and b.verification_status = 'verified'
      and (
        (
          (storage.foldername(name))[1] = b.owner_id::text
          and (storage.foldername(name))[2] = 'business'
        )
        or (
          (storage.foldername(name))[1] = 'business'
          and (storage.foldername(name))[2] in (b.id::text, b.owner_id::text)
        )
      )
      and (
        b.logo_url = storage.objects.name
        or b.cover_url = storage.objects.name
        or exists (
          select 1
          from public.business_photos photo
          where photo.business_id = b.id
            and photo.storage_path = storage.objects.name
        )
        or exists (
          select 1
          from public.posts post
          where post.business_id = b.id
            and post.status = 'published'
            and storage.objects.name = any(post.media_urls)
        )
        or exists (
          select 1
          from public.reviews review
          where review.business_id = b.id
            and review.hidden = false
            and storage.objects.name = any(review.photo_urls)
        )
      )
  )
);

drop policy if exists "Travelers view live business videos" on storage.objects;
create policy "Travelers view live business videos"
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'videos'
  and (storage.foldername(name))[2] = 'business'
  and exists (
    select 1
    from public.posts post
    join public.businesses b on b.id = post.business_id
    where b.owner_id::text = (storage.foldername(name))[1]
      and b.live = true
      and b.verification_status = 'verified'
      and post.status = 'published'
      and post.video_url = storage.objects.name
  )
);

do $$
declare
  table_name text;
begin
  foreach table_name in array array['comments', 'post_likes']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end $$;
