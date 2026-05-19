with ranked_lessons as (
  select
    id,
    row_number() over (
      partition by track_id, order_index
      order by created_at asc, id asc
    ) as rn
  from public.lessons
  where is_active = true
)
delete from public.lessons
where id in (
  select id
  from ranked_lessons
  where rn > 1
);

create unique index if not exists lessons_track_order_active_key
  on public.lessons(track_id, order_index)
  where is_active = true;
