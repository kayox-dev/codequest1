create table if not exists public.user_mission_rewards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  mission_key text not null,
  mission_type text not null check (mission_type in ('daily','weekly','special')),
  xp_reward int not null default 0,
  claimed_at timestamptz default now(),
  unique(user_id, mission_key)
);

alter table public.user_mission_rewards enable row level security;

drop policy if exists umr_select on public.user_mission_rewards;
create policy umr_select on public.user_mission_rewards for select using (auth.uid()=user_id);

drop policy if exists umr_insert on public.user_mission_rewards;
create policy umr_insert on public.user_mission_rewards for insert with check (auth.uid()=user_id);

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
    raise exception 'Usuário inválido para resgatar missão';
  end if;

  if p_mission_type not in ('daily','weekly','special') then
    raise exception 'Tipo de missão inválido';
  end if;

  insert into public.user_mission_rewards(user_id,mission_key,mission_type,xp_reward)
  values(p_user_id,p_mission_key,p_mission_type,greatest(0,p_xp_reward))
  on conflict(user_id,mission_key) do nothing
  returning * into reward;

  if reward.id is null then
    return jsonb_build_object(
      'already_claimed',true,
      'xp_added',0,
      'new_xp',(select xp_total from public.profiles where user_id=p_user_id),
      'new_level',(select level from public.profiles where user_id=p_user_id),
      'leveled_up',false
    );
  end if;

  xp := public.add_xp(p_user_id,p_xp_reward,'mission',reward.id,p_description);

  return xp || jsonb_build_object(
    'already_claimed',false,
    'mission_key',p_mission_key,
    'reward_id',reward.id
  );
end;
$$;
