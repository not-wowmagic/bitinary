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
