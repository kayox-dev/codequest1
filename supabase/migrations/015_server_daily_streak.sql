alter table public.profiles add column if not exists last_streak_date date;
alter table public.profiles add column if not exists best_streak int not null default 0;

create or replace function public.refresh_daily_streak(
  p_user_id uuid
) returns jsonb
language plpgsql
security definer
as $$
declare
  today date := current_date;
  previous_date date;
  current_streak int;
  current_best int;
  next_streak int;
begin
  if p_user_id <> auth.uid() then
    raise exception 'Usuario invalido para atualizar streak';
  end if;

  select coalesce(last_streak_date, streak_last_date), coalesce(streak, 0), coalesce(best_streak, 0)
    into previous_date, current_streak, current_best
  from public.profiles
  where user_id = p_user_id
  for update;

  if current_streak is null then
    raise exception 'Perfil nao encontrado para atualizar streak';
  end if;

  next_streak := case
    when previous_date is null then 0
    when previous_date < (today - interval '1 day')::date then 0
    else current_streak
  end;

  if next_streak <> current_streak then
    update public.profiles
    set streak = next_streak,
        best_streak = greatest(current_best, next_streak),
        updated_at = now()
    where user_id = p_user_id;

    update public.rankings
    set streak = next_streak,
        updated_at = now()
    where user_id = p_user_id;
  end if;

  return jsonb_build_object(
    'streak', next_streak,
    'best_streak', greatest(current_best, next_streak),
    'last_streak_date', previous_date,
    'reset', next_streak <> current_streak
  );
end;
$$;

create or replace function public.record_valid_streak_activity(
  p_user_id uuid
) returns jsonb
language plpgsql
security definer
as $$
declare
  today date := current_date;
  previous_date date;
  previous_streak int;
  previous_best int;
  next_streak int;
  next_best int;
  counted_today boolean := false;
begin
  if p_user_id <> auth.uid() then
    raise exception 'Usuario invalido para atualizar streak';
  end if;

  select coalesce(last_streak_date, streak_last_date), coalesce(streak, 0), coalesce(best_streak, 0)
    into previous_date, previous_streak, previous_best
  from public.profiles
  where user_id = p_user_id
  for update;

  if previous_streak is null then
    raise exception 'Perfil nao encontrado para atualizar streak';
  end if;

  if previous_date = today then
    counted_today := true;
    next_streak := previous_streak;
  elsif previous_date = (today - interval '1 day')::date then
    next_streak := previous_streak + 1;
  else
    next_streak := 1;
  end if;

  next_best := greatest(previous_best, next_streak);

  update public.profiles
  set streak = next_streak,
      best_streak = next_best,
      last_streak_date = today,
      streak_last_date = today,
      updated_at = now()
  where user_id = p_user_id;

  update public.rankings
  set streak = next_streak,
      updated_at = now()
  where user_id = p_user_id;

  return jsonb_build_object(
    'streak', next_streak,
    'best_streak', next_best,
    'last_streak_date', today,
    'counted_today', counted_today,
    'incremented', not counted_today
  );
end;
$$;

create or replace function public.record_lesson_activity_streak(
  p_user_id uuid,
  p_lesson_id uuid,
  p_local_date date default null
) returns jsonb
language plpgsql
security definer
as $$
declare
  lesson_exists boolean;
begin
  if p_user_id <> auth.uid() then
    raise exception 'Usuario invalido para atualizar streak';
  end if;

  select exists(
    select 1
    from public.lessons
    where id = p_lesson_id
      and is_active = true
  ) into lesson_exists;

  if not lesson_exists then
    raise exception 'Licao real nao encontrada para streak';
  end if;

  return public.record_valid_streak_activity(p_user_id);
end;
$$;

create or replace function public.complete_lesson(
  p_user_id uuid,
  p_lesson_id uuid,
  p_score int default 100
) returns jsonb
language plpgsql
security definer
as $$
declare
  l public.lessons%rowtype;
  old_status text;
  nxt public.lessons%rowtype;
  total int;
  completed int;
  percent int;
  xp jsonb;
  streak_state jsonb;
begin
  if p_user_id <> auth.uid() then
    raise exception 'Usuario invalido para concluir licao';
  end if;

  select * into l
  from public.lessons
  where id = p_lesson_id
    and is_active = true;

  if l.id is null then
    raise exception 'Licao nao encontrada';
  end if;

  select status into old_status
  from public.user_lesson_progress
  where user_id = p_user_id
    and lesson_id = p_lesson_id
  for update;

  select count(*) into total
  from public.lessons
  where track_id = l.track_id
    and is_active = true;

  if old_status = 'completed' then
    select count(*) into completed
    from public.user_lesson_progress
    where user_id = p_user_id
      and track_id = l.track_id
      and status = 'completed';

    percent := case when total = 0 then 0 else floor((completed::float / total::float) * 100) end;
    streak_state := public.refresh_daily_streak(p_user_id);

    return jsonb_build_object(
      'already_completed', true,
      'xp_added', 0,
      'new_xp', (select xp_total from public.profiles where user_id = p_user_id),
      'new_level', (select level from public.profiles where user_id = p_user_id),
      'leveled_up', false,
      'progress_percent', percent
    ) || streak_state;
  end if;

  update public.user_lesson_progress
  set status = 'completed',
      score = p_score,
      attempts = attempts + 1,
      xp_earned = l.xp_reward,
      completed_at = now()
  where user_id = p_user_id
    and lesson_id = p_lesson_id;

  select * into nxt
  from public.lessons
  where track_id = l.track_id
    and is_active = true
    and order_index > l.order_index
  order by order_index
  limit 1;

  if nxt.id is not null then
    insert into public.user_lesson_progress(user_id, lesson_id, track_id, status)
    values(p_user_id, nxt.id, l.track_id, 'available')
    on conflict(user_id, lesson_id) do update
    set status = case
      when public.user_lesson_progress.status = 'locked' then 'available'
      else public.user_lesson_progress.status
    end;
  end if;

  select count(*) into completed
  from public.user_lesson_progress
  where user_id = p_user_id
    and track_id = l.track_id
    and status = 'completed';

  percent := case when total = 0 then 0 else floor((completed::float / total::float) * 100) end;

  update public.user_track_progress
  set lessons_completed = completed,
      progress_percent = percent,
      xp_earned = xp_earned + l.xp_reward,
      current_lesson_id = coalesce(nxt.id, p_lesson_id),
      is_completed = (percent >= 100),
      completed_at = case when percent >= 100 then now() else null end
  where user_id = p_user_id
    and track_id = l.track_id;

  xp := public.add_xp(p_user_id, l.xp_reward, 'lesson', p_lesson_id, 'Licao concluida: ' || l.title);
  streak_state := public.record_valid_streak_activity(p_user_id);

  return xp || streak_state || jsonb_build_object(
    'already_completed', false,
    'next_lesson_id', nxt.id,
    'progress_percent', percent
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
  streak_state jsonb;
begin
  if p_user_id <> auth.uid() then
    raise exception 'Usuario invalido para resgatar desafio';
  end if;

  insert into public.user_challenge_rewards(user_id, challenge_slug, xp_reward)
  values(p_user_id, p_challenge_slug, greatest(0, coalesce(p_xp_reward, 0)))
  on conflict(user_id, challenge_slug) do nothing
  returning * into reward;

  if reward.id is null then
    streak_state := public.refresh_daily_streak(p_user_id);

    return jsonb_build_object(
      'already_claimed', true,
      'xp_added', 0,
      'new_xp', (select xp_total from public.profiles where user_id = p_user_id),
      'new_level', (select level from public.profiles where user_id = p_user_id),
      'leveled_up', false
    ) || streak_state;
  end if;

  xp := public.add_xp(p_user_id, reward.xp_reward, 'challenge', reward.id, p_description);
  streak_state := public.record_valid_streak_activity(p_user_id);

  return xp || streak_state || jsonb_build_object(
    'challenge_slug', p_challenge_slug,
    'reward_id', reward.id
  );
end;
$$;

grant execute on function public.refresh_daily_streak(uuid) to authenticated;
grant execute on function public.record_valid_streak_activity(uuid) to authenticated;
grant execute on function public.record_lesson_activity_streak(uuid, uuid, date) to authenticated;
grant execute on function public.complete_lesson(uuid, uuid, int) to authenticated;
grant execute on function public.claim_challenge_reward(uuid, text, int, text) to authenticated;
