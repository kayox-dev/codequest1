delete from public.missions m
using (
  select
    id,
    row_number() over (
      partition by type, lower(trim(title))
      order by is_active desc, id
    ) as row_number
  from public.missions
) duplicates
where m.id = duplicates.id
  and duplicates.row_number > 1;

drop index if exists public.missions_type_title_key;
create unique index if not exists missions_type_title_key
  on public.missions(type, lower(trim(title)))
  where is_active = true;

delete from public.xp_history h
using (
  select
    id,
    row_number() over (
      partition by user_id, source, source_id
      order by created_at asc, id
    ) as row_number
  from public.xp_history
  where source_id is not null
) duplicates
where h.id = duplicates.id
  and duplicates.row_number > 1;

create unique index if not exists xp_history_unique_reward_source
  on public.xp_history(user_id, source, source_id)
  where source_id is not null;

create table if not exists public.user_challenge_rewards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  challenge_slug text not null,
  xp_reward int not null default 0,
  claimed_at timestamptz default now(),
  unique(user_id, challenge_slug)
);

alter table public.user_challenge_rewards enable row level security;

drop policy if exists ucr_select on public.user_challenge_rewards;
create policy ucr_select on public.user_challenge_rewards
  for select using (auth.uid() = user_id);

drop policy if exists ucr_insert on public.user_challenge_rewards;
create policy ucr_insert on public.user_challenge_rewards
  for insert with check (auth.uid() = user_id);

create or replace function public.add_xp(
  p_user_id uuid,
  p_amount int,
  p_source text,
  p_source_id uuid default null,
  p_description text default null
) returns jsonb
language plpgsql
security definer
as $$
declare
  old_xp int;
  old_level int;
  old_streak int;
  new_xp int;
  new_level int;
  safe_amount int := greatest(0, coalesce(p_amount, 0));
begin
  if p_user_id <> auth.uid() then
    raise exception 'Usuario invalido para adicionar XP';
  end if;

  if p_source_id is not null and exists (
    select 1
    from public.xp_history
    where user_id = p_user_id
      and source = p_source
      and source_id = p_source_id
  ) then
    return jsonb_build_object(
      'already_claimed', true,
      'xp_added', 0,
      'new_xp', (select xp_total from public.profiles where user_id = p_user_id),
      'new_level', (select level from public.profiles where user_id = p_user_id),
      'leveled_up', false
    );
  end if;

  select xp_total, level, streak
    into old_xp, old_level, old_streak
  from public.profiles
  where user_id = p_user_id
  for update;

  if old_xp is null then
    raise exception 'Perfil nao encontrado para adicionar XP';
  end if;

  new_xp := coalesce(old_xp, 0) + safe_amount;
  new_level := public.calculate_level(new_xp);

  update public.profiles
  set xp_total = new_xp,
      level = new_level,
      updated_at = now()
  where user_id = p_user_id;

  insert into public.rankings(user_id, xp_total, level, streak, updated_at)
  values(p_user_id, new_xp, new_level, coalesce(old_streak, 0), now())
  on conflict(user_id) do update
  set xp_total = excluded.xp_total,
      level = excluded.level,
      streak = excluded.streak,
      updated_at = now();

  insert into public.xp_history(user_id, amount, source, source_id, description)
  values(p_user_id, safe_amount, p_source, p_source_id, p_description);

  return jsonb_build_object(
    'already_claimed', false,
    'new_xp', new_xp,
    'new_level', new_level,
    'leveled_up', new_level > coalesce(old_level, 1),
    'xp_added', safe_amount
  );
end;
$$;

create or replace function public.claim_mission_reward(
  p_user_id uuid,
  p_mission_key text,
  p_mission_type text,
  p_xp_reward int,
  p_description text
) returns jsonb
language plpgsql
security definer
as $$
declare
  reward public.user_mission_rewards%rowtype;
  xp jsonb;
begin
  if p_user_id <> auth.uid() then
    raise exception 'Usuario invalido para resgatar missao';
  end if;

  if p_mission_type not in ('daily', 'weekly', 'special') then
    raise exception 'Tipo de missao invalido';
  end if;

  insert into public.user_mission_rewards(user_id, mission_key, mission_type, xp_reward)
  values(p_user_id, p_mission_key, p_mission_type, greatest(0, coalesce(p_xp_reward, 0)))
  on conflict(user_id, mission_key) do nothing
  returning * into reward;

  if reward.id is null then
    return jsonb_build_object(
      'already_claimed', true,
      'xp_added', 0,
      'new_xp', (select xp_total from public.profiles where user_id = p_user_id),
      'new_level', (select level from public.profiles where user_id = p_user_id),
      'leveled_up', false
    );
  end if;

  xp := public.add_xp(p_user_id, reward.xp_reward, 'mission', reward.id, p_description);

  return xp || jsonb_build_object(
    'mission_key', p_mission_key,
    'reward_id', reward.id
  );
end;
$$;

create or replace function public.claim_challenge_reward(
  p_user_id uuid,
  p_challenge_slug text,
  p_xp_reward int,
  p_description text
) returns jsonb
language plpgsql
security definer
as $$
declare
  reward public.user_challenge_rewards%rowtype;
  xp jsonb;
begin
  if p_user_id <> auth.uid() then
    raise exception 'Usuario invalido para resgatar desafio';
  end if;

  insert into public.user_challenge_rewards(user_id, challenge_slug, xp_reward)
  values(p_user_id, p_challenge_slug, greatest(0, coalesce(p_xp_reward, 0)))
  on conflict(user_id, challenge_slug) do nothing
  returning * into reward;

  if reward.id is null then
    return jsonb_build_object(
      'already_claimed', true,
      'xp_added', 0,
      'new_xp', (select xp_total from public.profiles where user_id = p_user_id),
      'new_level', (select level from public.profiles where user_id = p_user_id),
      'leveled_up', false
    );
  end if;

  xp := public.add_xp(p_user_id, reward.xp_reward, 'challenge', reward.id, p_description);

  return xp || jsonb_build_object(
    'challenge_slug', p_challenge_slug,
    'reward_id', reward.id
  );
end;
$$;

grant execute on function public.add_xp(uuid, int, text, uuid, text) to authenticated;
grant execute on function public.claim_mission_reward(uuid, text, text, int, text) to authenticated;
grant execute on function public.claim_challenge_reward(uuid, text, int, text) to authenticated;
