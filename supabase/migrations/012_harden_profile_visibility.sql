alter table public.rankings add column if not exists username text;

update public.rankings r
set username = coalesce(p.username, 'Dev')
from public.profiles p
where p.user_id = r.user_id
  and coalesce(r.username, '') <> coalesce(p.username, 'Dev');

create or replace function public.sync_ranking_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.rankings(user_id, username, xp_total, level, streak, updated_at)
  values(new.user_id, coalesce(new.username, 'Dev'), coalesce(new.xp_total, 0), coalesce(new.level, 1), coalesce(new.streak, 0), now())
  on conflict(user_id) do update
  set username = excluded.username,
      xp_total = excluded.xp_total,
      level = excluded.level,
      streak = excluded.streak,
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists sync_ranking_profile_fields on public.profiles;
create trigger sync_ranking_profile_fields
  after insert or update of username, xp_total, level, streak on public.profiles
  for each row
  execute function public.sync_ranking_profile_fields();

alter table public.profiles enable row level security;
alter table public.rankings enable row level security;

drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_select_public on public.profiles;

create policy profiles_select_own
  on public.profiles
  for select
  using (auth.uid() = user_id);

drop policy if exists rankings_select on public.rankings;
create policy rankings_select
  on public.rankings
  for select
  using (true);
