
create extension if not exists pgcrypto;

create type public.account_role as enum ('traveler', 'business');
create type public.business_verification_status as enum ('none', 'pending', 'verified', 'needs-docs');
create type public.post_status as enum ('draft', 'scheduled', 'published');
create type public.review_case_status as enum ('received', 'review', 'info', 'removed', 'kept', 'appealed');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.account_role not null default 'traveler',
  name text not null default '',
  nickname text not null default '',
  avatar_url text,
  age_range text,
  city text,
  mobile text,
  consent_location boolean not null default false,
  consent_personalization boolean not null default true,
  consent_marketing boolean not null default false,
  consent_moments_share boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.traveler_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  last_trip text,
  last_trip_at timestamptz,
  trip_checked_at timestamptz,
  frequency text,
  next_trip text,
  daily_budget numeric(12, 2) not null default 1500 check (daily_budget >= 0),
  meal_budget numeric(12, 2) not null default 300 check (meal_budget >= 0),
  flexible boolean not null default false,
  foods text[] not null default '{}',
  diet text[] not null default '{}',
  allergy text,
  interests text[] not null default '{}',
  companions text[] not null default '{}',
  transport text[] not null default '{}',
  pace text,
  needs text[] not null default '{}',
  completed_sections jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  business_type text,
  price_range text,
  address text not null default '',
  city text not null default '',
  latitude double precision,
  longitude double precision,
  contact_name text not null default '',
  mobile text not null default '',
  landline text not null default '',
  about text not null default '',
  specialties text[] not null default '{}',
  languages text[] not null default '{Tagalog}',
  goals text[] not null default '{}',
  cover_url text,
  links jsonb not null default '{"facebook":"","instagram":"","tiktok":"","website":""}'::jsonb,
  live boolean not null default false,
  live_at timestamptz,
  verification_status public.business_verification_status not null default 'none',
  verification_method text check (verification_method in ('upload', 'onsite')),
  verification_files text[] not null default '{}',
  onsite_date date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.business_hours (
  business_id uuid not null references public.businesses(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  opens_at time,
  closes_at time,
  is_closed boolean not null default false,
  all_day boolean not null default false,
  primary key (business_id, day_of_week)
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  price numeric(12, 2) not null check (price >= 0),
  category text not null default '',
  sort_order integer not null default 0
);

create table public.business_photos (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  storage_path text not null,
  is_cover boolean not null default false,
  sort_order integer not null default 0
);

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  area text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

create table public.business_staff (
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  email text not null,
  name text not null default '',
  role text not null check (role in ('owner', 'manager', 'staff')),
  status text not null default 'invited' check (status in ('active', 'invited')),
  branch_id uuid references public.branches(id) on delete set null,
  primary key (business_id, email)
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  post_type text not null check (post_type in ('post', 'reel', 'blog')),
  title text,
  body text not null default '',
  media_urls text[] not null default '{}',
  video_url text,
  status public.post_status not null default 'draft',
  published_at timestamptz,
  scheduled_at timestamptz,
  views integer not null default 0 check (views >= 0),
  likes integer not null default 0 check (likes >= 0),
  saves integer not null default 0 check (saves >= 0),
  comments_count integer not null default 0 check (comments_count >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null,
  reply text,
  hidden boolean not null default false,
  reported_reason text,
  blocked boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  stars smallint not null check (stars between 1 and 5),
  body text not null,
  photo_urls text[] not null default '{}',
  visited boolean not null default false,
  checkin_at timestamptz,
  checkin_via text check (checkin_via in ('QR', 'code')),
  reply text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.review_cases (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  reason text not null,
  explanation text not null default '',
  evidence_urls text[] not null default '{}',
  status public.review_case_status not null default 'received',
  timeline jsonb not null default '[]'::jsonb,
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  decided_at timestamptz
);

create table public.deals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  kind text not null check (kind in ('b1t1', 'discount', 'addon')),
  item text not null,
  percent numeric(5, 2) check (percent between 0 and 100),
  min_spend numeric(12, 2) check (min_spend >= 0),
  addon text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  limit_per_day integer not null default 0 check (limit_per_day >= 0),
  limit_total integer not null default 0 check (limit_total >= 0),
  redemption text not null check (redemption in ('qr', 'code')),
  code text not null unique,
  status text not null default 'draft' check (status in ('active', 'scheduled', 'ended', 'draft')),
  redeemed_qr integer not null default 0 check (redeemed_qr >= 0),
  redeemed_code integer not null default 0 check (redeemed_code >= 0),
  views integer not null default 0 check (views >= 0)
);

create table public.boosts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  budget numeric(12, 2) not null check (budget >= 0),
  days integer not null check (days > 0),
  target text not null check (target in ('nearby2', 'nearby5', 'searching')),
  status text not null default 'active' check (status in ('active', 'ended')),
  starts_at timestamptz not null default timezone('utc', now()),
  reach integer not null default 0,
  clicks integer not null default 0,
  saves integer not null default 0
);

create table public.saved_places (
  user_id uuid not null references public.profiles(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, business_id)
);

create table public.itineraries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  subtitle text,
  budget numeric(12, 2) not null default 0 check (budget >= 0),
  area text,
  image_url text,
  is_saved boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.itinerary_stops (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references public.itineraries(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete set null,
  stop_time text not null,
  name text not null,
  kind text not null,
  cost numeric(12, 2) not null default 0 check (cost >= 0),
  note text,
  sort_order integer not null default 0
);

create table public.moments (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,
  caption text not null default '',
  visited_at date not null default current_date,
  place_name text not null,
  area text not null default '',
  latitude double precision,
  longitude double precision,
  kind text not null,
  trip text,
  frame text not null default 'classic',
  tilt numeric(4, 1) not null default 0,
  on_map boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.reservation_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  requester_id uuid references public.profiles(id) on delete set null,
  guest_name text not null,
  party_size integer not null check (party_size > 0),
  requested_at timestamptz not null,
  status text not null default 'new' check (status in ('new', 'accepted', 'declined')),
  note text
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null default '',
  target text,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index posts_business_published_idx on public.posts (business_id, published_at desc);
create index reviews_business_created_idx on public.reviews (business_id, created_at desc);
create index comments_post_created_idx on public.comments (post_id, created_at);
create index moments_author_created_idx on public.moments (author_id, created_at desc);
create index notifications_user_created_idx on public.notifications (user_id, created_at desc);

create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger businesses_updated_at before update on public.businesses
for each row execute function public.set_updated_at();
create trigger posts_updated_at before update on public.posts
for each row execute function public.set_updated_at();
create trigger itineraries_updated_at before update on public.itineraries
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.traveler_preferences enable row level security;
alter table public.businesses enable row level security;
alter table public.business_hours enable row level security;
alter table public.menu_items enable row level security;
alter table public.business_photos enable row level security;
alter table public.branches enable row level security;
alter table public.business_staff enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.reviews enable row level security;
alter table public.review_cases enable row level security;
alter table public.deals enable row level security;
alter table public.boosts enable row level security;
alter table public.saved_places enable row level security;
alter table public.itineraries enable row level security;
alter table public.itinerary_stops enable row level security;
alter table public.moments enable row level security;
alter table public.reservation_requests enable row level security;
alter table public.notifications enable row level security;

create policy "Users manage their profile" on public.profiles
for all using (id = auth.uid()) with check (id = auth.uid());
create policy "Users manage their preferences" on public.traveler_preferences
for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users manage saved places" on public.saved_places
for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users manage itineraries" on public.itineraries
for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users manage itinerary stops" on public.itinerary_stops
for all using (exists (
  select 1 from public.itineraries i
  where i.id = itinerary_id and i.user_id = auth.uid()
)) with check (exists (
  select 1 from public.itineraries i
  where i.id = itinerary_id and i.user_id = auth.uid()
));
create policy "Users manage moments" on public.moments
for all using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "Users view notifications" on public.notifications
for select using (user_id = auth.uid());
create policy "Users update notifications" on public.notifications
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Public can view live businesses" on public.businesses
for select using (live = true or owner_id = auth.uid());
create policy "Owners manage businesses" on public.businesses
for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "Public can view business hours" on public.business_hours
for select using (exists (
  select 1 from public.businesses b where b.id = business_id and b.live = true
));
create policy "Owners manage business hours" on public.business_hours
for all using (exists (
  select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()
)) with check (exists (
  select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()
));

create policy "Public can view menus" on public.menu_items
for select using (exists (
  select 1 from public.businesses b where b.id = business_id and b.live = true
));
create policy "Owners manage menus" on public.menu_items
for all using (exists (
  select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()
)) with check (exists (
  select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()
));

create policy "Public can view business photos" on public.business_photos
for select using (exists (
  select 1 from public.businesses b where b.id = business_id and b.live = true
));
create policy "Owners manage business photos" on public.business_photos
for all using (exists (
  select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()
)) with check (exists (
  select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()
));

create policy "Public can view branches" on public.branches
for select using (exists (
  select 1 from public.businesses b where b.id = business_id and b.live = true
));
create policy "Owners manage branches" on public.branches
for all using (exists (
  select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()
)) with check (exists (
  select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()
));

create policy "Owners manage business staff" on public.business_staff
for all using (exists (
  select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()
)) with check (exists (
  select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()
));

create policy "Public can view business content" on public.posts
for select using (
  status = 'published'
  or exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid())
);
create policy "Owners manage posts" on public.posts
for all using (exists (
  select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()
)) with check (exists (
  select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()
));

create policy "Public can view reviews" on public.reviews
for select using (true);
create policy "Users create reviews" on public.reviews
for insert with check (author_id = auth.uid());
create policy "Authors update reviews" on public.reviews
for update using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "Owners manage review replies" on public.reviews
for update using (exists (
  select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()
)) with check (exists (
  select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()
));
create policy "Users create comments" on public.comments
for insert with check (author_id = auth.uid());
create policy "Public can view visible comments" on public.comments
for select using (hidden = false or author_id = auth.uid());
create policy "Owners moderate comments" on public.comments
for update using (exists (
  select 1 from public.posts p
  join public.businesses b on b.id = p.business_id
  where p.id = post_id and b.owner_id = auth.uid()
)) with check (exists (
  select 1 from public.posts p
  join public.businesses b on b.id = p.business_id
  where p.id = post_id and b.owner_id = auth.uid()
));

create policy "Owners manage review cases" on public.review_cases
for all using (exists (
  select 1 from public.reviews r
  join public.businesses b on b.id = r.business_id
  where r.id = review_id and b.owner_id = auth.uid()
)) with check (exists (
  select 1 from public.reviews r
  join public.businesses b on b.id = r.business_id
  where r.id = review_id and b.owner_id = auth.uid()
));
create policy "Public can view active deals" on public.deals
for select using (status = 'active' and ends_at > timezone('utc', now()));
create policy "Owners manage deals" on public.deals
for all using (exists (
  select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()
)) with check (exists (
  select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()
));
create policy "Owners manage boosts" on public.boosts
for all using (exists (
  select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()
)) with check (exists (
  select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()
));
create policy "Users create reservations" on public.reservation_requests
for insert with check (requester_id = auth.uid());
create policy "Users view their reservations" on public.reservation_requests
for select using (
  requester_id = auth.uid()
  or exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid())
);
create policy "Owners manage reservations" on public.reservation_requests
for update using (exists (
  select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()
)) with check (exists (
  select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()
));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''));
  insert into public.traveler_preferences (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
