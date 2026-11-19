create table if not exists public.traveler_preferences (
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

alter table public.traveler_preferences enable row level security;
grant select, insert, update, delete on public.traveler_preferences to authenticated;

drop policy if exists "Users manage their preferences" on public.traveler_preferences;
create policy "Users manage their preferences" on public.traveler_preferences
for all using (user_id = auth.uid()) with check (user_id = auth.uid());
