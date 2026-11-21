-- Hybrid search for Jimbot: city filter first, then vector rank.
create extension if not exists vector;

create table if not exists public.business_embeddings (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  embedding vector(1536) not null,
  content_hash text not null,
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists business_embeddings_embedding_idx
  on public.business_embeddings
  using hnsw (embedding vector_cosine_ops);

alter table public.business_embeddings enable row level security;

drop policy if exists "Public read business embeddings" on public.business_embeddings;
create policy "Public read business embeddings"
  on public.business_embeddings
  for select
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and b.live = true
    )
  );

drop policy if exists "Owners manage business embeddings" on public.business_embeddings;
create policy "Owners manage business embeddings"
  on public.business_embeddings
  for all
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and b.owner_id = auth.uid()
    )
  );

-- Rank verified live businesses in a city by cosine distance to a query embedding.
create or replace function public.search_businesses_hybrid(
  p_area text,
  p_query_embedding vector(1536),
  p_limit integer default 8
)
returns table (
  id uuid,
  name text,
  business_type text,
  price_range text,
  city text,
  latitude double precision,
  longitude double precision,
  about text,
  specialties text[],
  distance float
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    b.id,
    b.name,
    b.business_type,
    b.price_range,
    b.city,
    b.latitude,
    b.longitude,
    b.about,
    b.specialties,
    (e.embedding <=> p_query_embedding)::float as distance
  from public.businesses b
  join public.business_embeddings e on e.business_id = b.id
  where b.live = true
    and b.verification_status = 'verified'
    and b.city ilike '%' || p_area || '%'
  order by e.embedding <=> p_query_embedding
  limit greatest(1, least(coalesce(p_limit, 8), 10));
$$;

revoke all on function public.search_businesses_hybrid(text, vector, integer) from public;
grant execute on function public.search_businesses_hybrid(text, vector, integer) to anon, authenticated, service_role;
