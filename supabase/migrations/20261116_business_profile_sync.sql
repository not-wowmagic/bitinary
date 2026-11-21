do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'businesses',
    'business_hours',
    'menu_items',
    'business_photos',
    'posts',
    'reviews'
  ]
  loop
    if to_regclass(format('public.%I', table_name)) is null then
      continue;
    end if;
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end $$;

drop policy if exists "Travelers view live business images" on storage.objects;
create policy "Travelers view live business images"
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'images'
  and (storage.foldername(name))[2] = 'business'
  and exists (
    select 1
    from public.businesses b
    where b.owner_id::text = (storage.foldername(name))[1]
      and b.live = true
      and b.verification_status = 'verified'
      and (
        b.cover_url = storage.objects.name
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
