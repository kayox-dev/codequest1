alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists avatar_preset text default 'neo-hacker';
alter table public.profiles add column if not exists avatar_skin text default '#F4C7A1';
alter table public.profiles add column if not exists avatar_hair text default '#6E3CFF';
alter table public.profiles add column if not exists avatar_hat text default 'none';
alter table public.profiles add column if not exists avatar_top text default 'hoodie';
alter table public.profiles add column if not exists avatar_shoes text default 'sneakers';

create unique index if not exists profiles_user_id_key on public.profiles(user_id);

alter table public.profiles enable row level security;

drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_select_public on public.profiles;
drop policy if exists profiles_insert on public.profiles;
drop policy if exists profiles_update on public.profiles;

create policy profiles_select_own
  on public.profiles
  for select
  using (auth.uid() = user_id);

create policy profiles_select_public
  on public.profiles
  for select
  using (true);

create policy profiles_insert
  on public.profiles
  for insert
  with check (auth.uid() = user_id);

create policy profiles_update
  on public.profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
