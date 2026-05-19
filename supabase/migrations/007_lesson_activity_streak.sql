alter table public.profiles add column if not exists last_streak_date date;
alter table public.profiles add column if not exists best_streak int not null default 0;

create or replace function public.record_lesson_activity_streak(
  p_user_id uuid,
  p_lesson_id uuid,
  p_local_date date
) returns jsonb
language plpgsql
security definer
as $$
declare
  lesson_exists boolean;
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

  select exists(
    select 1
    from public.lessons
    where id = p_lesson_id
      and is_active = true
  ) into lesson_exists;

  if not lesson_exists then
    raise exception 'Licao real nao encontrada para streak';
  end if;

  select coalesce(last_streak_date, streak_last_date), coalesce(streak, 0), coalesce(best_streak, 0)
    into previous_date, previous_streak, previous_best
  from public.profiles
  where user_id = p_user_id;

  if previous_streak is null then
    raise exception 'Perfil nao encontrado para atualizar streak';
  end if;

  if previous_date = p_local_date then
    counted_today := true;
    next_streak := previous_streak;
  elsif previous_date = (p_local_date - interval '1 day')::date then
    next_streak := previous_streak + 1;
  else
    next_streak := 1;
  end if;

  next_best := greatest(previous_best, next_streak);

  update public.profiles
  set streak = next_streak,
      best_streak = next_best,
      last_streak_date = p_local_date,
      streak_last_date = p_local_date
  where user_id = p_user_id;

  update public.rankings
  set streak = next_streak,
      updated_at = now()
  where user_id = p_user_id;

  return jsonb_build_object(
    'streak', next_streak,
    'best_streak', next_best,
    'last_streak_date', p_local_date,
    'counted_today', counted_today,
    'incremented', not counted_today
  );
end;
$$;

grant execute on function public.record_lesson_activity_streak(uuid, uuid, date) to authenticated;
