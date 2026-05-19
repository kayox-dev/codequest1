alter table public.profiles enable row level security;
alter table public.tracks enable row level security;
alter table public.lessons enable row level security;
alter table public.user_track_progress enable row level security;
alter table public.user_lesson_progress enable row level security;

insert into public.tracks(slug,title,description,long_description,difficulty,icon,color,total_lessons,total_xp,order_index,tags)
values
  ('frontend','Frontend','Construa interfaces web completas e navegaveis.','HTML, CSS, JavaScript, React, Next.js, acessibilidade, responsividade e projetos praticos em uma unica trilha frontend.','iniciante','FE','#38BDF8',0,0,1,array['frontend','web','roadmap']),
  ('backend','Backend','Crie APIs, autenticacao e persistencia.','Logica backend, Node.js, APIs, banco de dados, autenticacao, testes e deploy em uma unica trilha backend.','intermediario','BE','#22C55E',0,0,2,array['backend','api','database','roadmap']),
  ('python','Python','Automatize tarefas e construa solucoes com Python.','Fundamentos, estruturas de dados, funcoes, POO, automacao e APIs.','iniciante','PY','#FFD43B',0,0,3,array['python','automation','roadmap']),
  ('java','Java','Desenvolva aplicacoes robustas com Java.','Fundamentos, POO, collections, excecoes, Spring Boot e persistencia.','iniciante','JV','#F97316',0,0,4,array['backend','java','roadmap']),
  ('php','PHP','Crie sistemas web e APIs com PHP moderno.','Fundamentos, forms, banco de dados, MVC, Laravel e seguranca.','iniciante','PHP','#8B5CF6',0,0,5,array['backend','php','roadmap']),
  ('cybersecurity','Cybersecurity','Proteja aplicacoes e entenda fundamentos de seguranca.','Seguranca web, Linux, redes, HTTP, OWASP, pentest basico e hardening.','intermediario','SEC','#EF4444',0,0,6,array['security','cybersecurity','roadmap']),
  ('ai-engineer','AI Engineer','Construa produtos com IA de ponta a ponta.','Fundamentos de IA, prompt engineering, APIs de IA, modelos, RAG, agentes e automacao.','intermediario','AI','#A855F7',0,0,7,array['ai','python','roadmap']),
  ('mobile','Mobile','Crie apps mobile com fluxos reais.','Fundamentos mobile, React Native, UI mobile, navegacao, estado e consumo de APIs.','iniciante','APP','#06B6D4',0,0,8,array['mobile','apps','roadmap']),
  ('devops','DevOps','Automatize entrega, infraestrutura e observabilidade.','Linux, Git/GitHub, Docker, deploy, CI/CD, cloud, Kubernetes e monitoramento.','intermediario','OPS','#F59E0B',0,0,9,array['devops','cloud','roadmap']),
  ('game-development','Game Development','Construa jogos jogaveis com logica e polimento.','Logica, canvas, game loop, input, fisica basica, fases, HUD e projeto final.','iniciante','GAME','#EC4899',0,0,10,array['games','javascript','roadmap'])
on conflict(slug) do update set
  title=excluded.title,
  description=excluded.description,
  long_description=excluded.long_description,
  difficulty=excluded.difficulty,
  icon=excluded.icon,
  color=excluded.color,
  order_index=excluded.order_index,
  tags=excluded.tags,
  is_active=true;

with duplicate_map(alias_slug, canonical_slug) as (
  values
    ('html','frontend'),
    ('html-css','frontend'),
    ('html-e-css','frontend'),
    ('css','frontend'),
    ('javascript','frontend'),
    ('react','frontend'),
    ('typescript','frontend'),
    ('ui-ux','frontend'),
    ('uiux','frontend'),
    ('acessibilidade','frontend'),
    ('responsividade','frontend'),
    ('projetos-praticos','frontend'),
    ('nodejs','backend'),
    ('apis','backend'),
    ('banco-de-dados','backend'),
    ('database','backend'),
    ('git','devops'),
    ('seguranca-web','cybersecurity'),
    ('seguranca','cybersecurity'),
    ('security','cybersecurity')
),
move_plan as (
  select
    l.id as lesson_id,
    canonical.id as canonical_track_id,
    coalesce(existing.max_order,0) + row_number() over (
      partition by canonical.id
      order by alias_track.order_index, l.order_index, l.created_at, l.id
    ) as new_order_index
  from duplicate_map dm
  join public.tracks alias_track on alias_track.slug = dm.alias_slug
  join public.tracks canonical on canonical.slug = dm.canonical_slug
  join public.lessons l on l.track_id = alias_track.id and l.is_active = true
  left join lateral (
    select max(order_index) as max_order
    from public.lessons
    where track_id = canonical.id
      and is_active = true
  ) existing on true
)
update public.lessons l
set track_id = move_plan.canonical_track_id,
    order_index = move_plan.new_order_index,
    is_boss = false
from move_plan
where l.id = move_plan.lesson_id;

update public.user_lesson_progress ulp
set track_id = l.track_id
from public.lessons l
where ulp.lesson_id = l.id
  and ulp.track_id <> l.track_id;

with duplicate_map(alias_slug, canonical_slug) as (
  values
    ('html','frontend'),
    ('html-css','frontend'),
    ('html-e-css','frontend'),
    ('css','frontend'),
    ('javascript','frontend'),
    ('react','frontend'),
    ('typescript','frontend'),
    ('ui-ux','frontend'),
    ('uiux','frontend'),
    ('acessibilidade','frontend'),
    ('responsividade','frontend'),
    ('projetos-praticos','frontend'),
    ('nodejs','backend'),
    ('apis','backend'),
    ('banco-de-dados','backend'),
    ('database','backend'),
    ('git','devops'),
    ('seguranca-web','cybersecurity'),
    ('seguranca','cybersecurity'),
    ('security','cybersecurity')
)
update public.profiles p
set selected_track_id = canonical.id
from public.tracks alias_track
join duplicate_map dm on dm.alias_slug = alias_track.slug
join public.tracks canonical on canonical.slug = dm.canonical_slug
where p.selected_track_id = alias_track.id;

with duplicate_map(alias_slug, canonical_slug) as (
  values
    ('html','frontend'),
    ('html-css','frontend'),
    ('html-e-css','frontend'),
    ('css','frontend'),
    ('javascript','frontend'),
    ('react','frontend'),
    ('typescript','frontend'),
    ('ui-ux','frontend'),
    ('uiux','frontend'),
    ('acessibilidade','frontend'),
    ('responsividade','frontend'),
    ('projetos-praticos','frontend'),
    ('nodejs','backend'),
    ('apis','backend'),
    ('banco-de-dados','backend'),
    ('database','backend'),
    ('git','devops'),
    ('seguranca-web','cybersecurity'),
    ('seguranca','cybersecurity'),
    ('security','cybersecurity')
),
progress_sources as (
  select distinct utp.user_id, canonical.id as canonical_track_id
  from public.user_track_progress utp
  join public.tracks source_track on source_track.id = utp.track_id
  join duplicate_map dm on dm.alias_slug = source_track.slug
  join public.tracks canonical on canonical.slug = dm.canonical_slug
  union
  select distinct utp.user_id, utp.track_id
  from public.user_track_progress utp
  join public.tracks canonical on canonical.id = utp.track_id
  where canonical.slug in ('frontend','backend','python','java','php','cybersecurity','ai-engineer','mobile','devops','game-development')
  union
  select distinct ulp.user_id, l.track_id
  from public.user_lesson_progress ulp
  join public.lessons l on l.id = ulp.lesson_id
  join public.tracks canonical on canonical.id = l.track_id
  where canonical.slug in ('frontend','backend','python','java','php','cybersecurity','ai-engineer','mobile','devops','game-development')
)
insert into public.user_track_progress(user_id,track_id,progress_percent,xp_earned,current_lesson_id,lessons_completed,is_completed)
select user_id, canonical_track_id, 0, 0, null, 0, false
from progress_sources
on conflict(user_id,track_id) do nothing;

insert into public.user_lesson_progress(user_id,lesson_id,track_id,status)
select
  utp.user_id,
  l.id,
  l.track_id,
  case when l.order_index = 1 then 'available' else 'locked' end
from public.user_track_progress utp
join public.tracks t on t.id = utp.track_id
join public.lessons l on l.track_id = t.id and l.is_active = true
where t.slug in ('frontend','backend','python','java','php','cybersecurity','ai-engineer','mobile','devops','game-development')
on conflict(user_id,lesson_id) do nothing;

with duplicate_map(alias_slug, canonical_slug) as (
  values
    ('html','frontend'),
    ('html-css','frontend'),
    ('html-e-css','frontend'),
    ('css','frontend'),
    ('javascript','frontend'),
    ('react','frontend'),
    ('typescript','frontend'),
    ('ui-ux','frontend'),
    ('uiux','frontend'),
    ('acessibilidade','frontend'),
    ('responsividade','frontend'),
    ('projetos-praticos','frontend'),
    ('nodejs','backend'),
    ('apis','backend'),
    ('banco-de-dados','backend'),
    ('database','backend'),
    ('git','devops'),
    ('seguranca-web','cybersecurity'),
    ('seguranca','cybersecurity'),
    ('security','cybersecurity')
),
alias_current as (
  select distinct on (utp.user_id, canonical.id)
    utp.user_id,
    canonical.id as canonical_track_id,
    case when current_lesson.track_id = canonical.id then utp.current_lesson_id else null end as current_lesson_id
  from public.user_track_progress utp
  join public.tracks alias_track on alias_track.id = utp.track_id
  join duplicate_map dm on dm.alias_slug = alias_track.slug
  join public.tracks canonical on canonical.slug = dm.canonical_slug
  left join public.lessons current_lesson on current_lesson.id = utp.current_lesson_id
  order by utp.user_id, canonical.id, utp.started_at desc
),
canonical_progress as (
  select utp.id, utp.user_id, utp.track_id
  from public.user_track_progress utp
  join public.tracks t on t.id = utp.track_id
  where t.slug in ('frontend','backend','python','java','php','cybersecurity','ai-engineer','mobile','devops','game-development')
),
stats as (
  select
    cp.id as progress_id,
    count(l.id)::int as total_lessons,
    count(l.id) filter (where ulp.status = 'completed')::int as completed_lessons,
    coalesce(sum(coalesce(nullif(ulp.xp_earned,0), l.xp_reward)) filter (where ulp.status = 'completed'),0)::int as earned_xp
  from canonical_progress cp
  join public.lessons l on l.track_id = cp.track_id and l.is_active = true
  left join public.user_lesson_progress ulp on ulp.user_id = cp.user_id and ulp.lesson_id = l.id
  group by cp.id
),
next_lesson as (
  select distinct on (cp.id)
    cp.id as progress_id,
    l.id as lesson_id
  from canonical_progress cp
  join public.lessons l on l.track_id = cp.track_id and l.is_active = true
  left join public.user_lesson_progress ulp on ulp.user_id = cp.user_id and ulp.lesson_id = l.id
  where coalesce(ulp.status,'locked') <> 'completed'
  order by cp.id, l.order_index, l.created_at, l.id
),
last_lesson as (
  select distinct on (track_id)
    track_id,
    id as lesson_id
  from public.lessons
  where is_active = true
  order by track_id, order_index desc, created_at desc, id desc
)
update public.user_track_progress utp
set lessons_completed = stats.completed_lessons,
    xp_earned = stats.earned_xp,
    progress_percent = case when stats.total_lessons = 0 then 0 else floor((stats.completed_lessons::float / stats.total_lessons::float) * 100)::int end,
    current_lesson_id = coalesce(alias_current.current_lesson_id, next_lesson.lesson_id, last_lesson.lesson_id),
    is_completed = stats.total_lessons > 0 and stats.completed_lessons >= stats.total_lessons,
    completed_at = case when stats.total_lessons > 0 and stats.completed_lessons >= stats.total_lessons then coalesce(utp.completed_at, now()) else null end
from stats
left join next_lesson on next_lesson.progress_id = stats.progress_id
join canonical_progress cp on cp.id = stats.progress_id
left join alias_current on alias_current.user_id = cp.user_id and alias_current.canonical_track_id = cp.track_id
left join last_lesson on last_lesson.track_id = cp.track_id
where utp.id = stats.progress_id;

update public.user_lesson_progress ulp
set status = 'available'
from public.user_track_progress utp
join public.tracks t on t.id = utp.track_id
where t.slug in ('frontend','backend','python','java','php','cybersecurity','ai-engineer','mobile','devops','game-development')
  and ulp.user_id = utp.user_id
  and ulp.lesson_id = utp.current_lesson_id
  and ulp.status = 'locked';

with canonical_tracks as (
  select id
  from public.tracks
  where slug in ('frontend','backend','python','java','php','cybersecurity','ai-engineer','mobile','devops','game-development')
),
last_active_lesson as (
  select distinct on (track_id)
    id,
    track_id
  from public.lessons
  where is_active = true
    and track_id in (select id from canonical_tracks)
  order by track_id, order_index desc, created_at desc, id desc
)
update public.lessons l
set is_boss = (l.id = last_active_lesson.id),
    type = case when l.id = last_active_lesson.id then 'projeto' else l.type end
from last_active_lesson
where l.track_id = last_active_lesson.track_id
  and l.is_active = true;

update public.tracks
set is_active = false,
    order_index = order_index + 100,
    tags = array_append(coalesce(tags,'{}'::text[]),'merged-duplicate')
where slug in (
  'html','html-css','html-e-css','css','javascript','react','typescript','ui-ux','uiux','acessibilidade','responsividade','projetos-praticos',
  'nodejs','apis','banco-de-dados','database','git','seguranca-web','seguranca','security'
);

update public.tracks t
set total_lessons = stats.lesson_count,
    total_xp = stats.total_xp
from (
  select track_id, count(*)::int as lesson_count, coalesce(sum(xp_reward),0)::int as total_xp
  from public.lessons
  where is_active = true
  group by track_id
) stats
where t.id = stats.track_id;

update public.tracks
set image_url = case slug
  when 'frontend' then '/track-art/frontend.svg'
  when 'backend' then '/track-art/backend.svg'
  when 'python' then '/track-art/python.svg'
  when 'java' then '/track-art/java.svg'
  when 'php' then '/track-art/php.svg'
  when 'cybersecurity' then '/track-art/cybersecurity.svg'
  when 'ai-engineer' then '/track-art/ai-engineer.svg'
  when 'mobile' then '/track-art/mobile.svg'
  when 'devops' then '/track-art/devops.svg'
  when 'game-development' then '/track-art/game-development.svg'
  else image_url
end
where slug in ('frontend','backend','python','java','php','cybersecurity','ai-engineer','mobile','devops','game-development');
