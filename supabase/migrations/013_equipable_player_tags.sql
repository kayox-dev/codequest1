alter table public.profiles add column if not exists tags text[] not null default '{}';
alter table public.profiles add column if not exists unlocked_tags text[] not null default '{}';
alter table public.profiles add column if not exists equipped_tag text;
alter table public.rankings add column if not exists equipped_tag text;

update public.profiles
set unlocked_tags = (
  select array(
    select distinct tag
    from unnest(coalesce(public.profiles.unlocked_tags, '{}') || coalesce(public.profiles.tags, '{}')) as tag
    where coalesce(tag, '') <> ''
  )
)
where coalesce(array_length(tags, 1), 0) > 0;

update public.profiles
set equipped_tag = null
where equipped_tag is not null
  and not (equipped_tag = any(coalesce(unlocked_tags, '{}')));

update public.rankings r
set equipped_tag = p.equipped_tag
from public.profiles p
where p.user_id = r.user_id
  and coalesce(r.equipped_tag, '') <> coalesce(p.equipped_tag, '');

create or replace function public.sync_ranking_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.rankings(user_id, username, equipped_tag, xp_total, level, streak, updated_at)
  values(new.user_id, coalesce(new.username, 'Dev'), new.equipped_tag, coalesce(new.xp_total, 0), coalesce(new.level, 1), coalesce(new.streak, 0), now())
  on conflict(user_id) do update
  set username = excluded.username,
      equipped_tag = excluded.equipped_tag,
      xp_total = excluded.xp_total,
      level = excluded.level,
      streak = excluded.streak,
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists sync_ranking_profile_fields on public.profiles;
create trigger sync_ranking_profile_fields
  after insert or update of username, equipped_tag, xp_total, level, streak on public.profiles
  for each row
  execute function public.sync_ranking_profile_fields();
