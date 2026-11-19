drop policy if exists "Users create reviews" on public.reviews;
create policy "Users create reviews" on public.reviews
for insert with check (
  author_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'traveler'
  )
);

drop policy if exists "Authors update reviews" on public.reviews;
create policy "Authors update reviews" on public.reviews
for update using (author_id = auth.uid()) with check (
  author_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'traveler'
  )
);
