create table if not exists public.jimbot_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  planning_context jsonb default '{}'::jsonb
);

create table if not exists public.jimbot_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.jimbot_conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('user', 'bot')),
  intent text,
  content text not null,
  payload jsonb default null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.jimbot_conversations
  add column if not exists planning_context jsonb default '{}'::jsonb;

alter table public.jimbot_messages
  add column if not exists payload jsonb default null;

alter table public.jimbot_conversations enable row level security;
alter table public.jimbot_messages enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'jimbot_conversations'
      and policyname = 'Users manage Jimbot conversations'
  ) then
    create policy "Users manage Jimbot conversations" on public.jimbot_conversations
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'jimbot_messages'
      and policyname = 'Users manage Jimbot messages'
  ) then
    create policy "Users manage Jimbot messages" on public.jimbot_messages
    for all using (user_id = auth.uid()) with check (
      user_id = auth.uid()
      and exists (
        select 1 from public.jimbot_conversations c
        where c.id = conversation_id and c.user_id = auth.uid()
      )
    );
  end if;
end $$;
