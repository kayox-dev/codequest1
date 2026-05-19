create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade unique not null,
  username text unique,
  avatar_url text,
  avatar_preset text default 'neo-hacker',
  avatar_skin text default '#F4C7A1',
  avatar_hair text default '#6E3CFF',
  avatar_hat text default 'none',
  avatar_top text default 'hoodie',
  avatar_shoes text default 'sneakers',
  bio text,
  level int not null default 1,
  xp_total int not null default 0,
  gems int not null default 0,
  streak int not null default 0,
  streak_last_date date,
  selected_track_id uuid,
  onboarding_completed boolean default false,
  skill_level text,
  goal text,
  daily_minutes int default 30,
  favorite_languages text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.tracks (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title text not null,
  description text,
  long_description text,
  difficulty text default 'iniciante',
  icon text default '💻',
  color text default '#7C3FFF',
  image_url text,
  total_lessons int default 0,
  total_xp int default 0,
  order_index int default 0,
  is_active boolean default true,
  tags text[] default '{}',
  created_at timestamptz default now()
);

create table if not exists public.lessons (
  id uuid primary key default uuid_generate_v4(),
  track_id uuid references public.tracks(id) on delete cascade not null,
  title text not null,
  description text,
  content jsonb default '[]',
  xp_reward int default 50,
  gem_reward int default 0,
  order_index int default 0,
  type text default 'teoria',
  estimated_minutes int default 10,
  is_active boolean default true,
  is_boss boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.user_track_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  track_id uuid references public.tracks(id) on delete cascade not null,
  progress_percent int default 0,
  xp_earned int default 0,
  current_lesson_id uuid references public.lessons(id),
  lessons_completed int default 0,
  is_completed boolean default false,
  started_at timestamptz default now(),
  completed_at timestamptz,
  unique(user_id, track_id)
);

create table if not exists public.user_lesson_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  lesson_id uuid references public.lessons(id) on delete cascade not null,
  track_id uuid references public.tracks(id) on delete cascade not null,
  status text default 'locked' check (status in ('locked','available','in_progress','completed')),
  score int,
  attempts int default 0,
  xp_earned int default 0,
  started_at timestamptz,
  completed_at timestamptz,
  unique(user_id, lesson_id)
);

create table if not exists public.xp_history (id uuid primary key default uuid_generate_v4(), user_id uuid references auth.users(id) on delete cascade not null, amount int not null, source text not null, source_id uuid, description text, created_at timestamptz default now());
create table if not exists public.rankings (id uuid primary key default uuid_generate_v4(), user_id uuid references auth.users(id) on delete cascade unique not null, xp_total int default 0, level int default 1, streak int default 0, position int, updated_at timestamptz default now());
create table if not exists public.missions (id uuid primary key default uuid_generate_v4(), title text not null, description text, type text default 'daily', xp_reward int default 100, gem_reward int default 0, requirement_type text, requirement_value int default 1, icon text default '🎯', is_active boolean default true);
create table if not exists public.achievements (id uuid primary key default uuid_generate_v4(), slug text unique not null, title text not null, description text, icon text default '🏅', rarity text default 'common', xp_reward int default 0, requirement_type text, requirement_value int default 1, is_active boolean default true);
create table if not exists public.devtags (id uuid primary key default uuid_generate_v4(), slug text unique not null, name text not null, description text, icon text default '🏷', color text default '#7C3FFF', requirement_type text, requirement_value int default 1, is_active boolean default true);
create table if not exists public.challenges (id uuid primary key default uuid_generate_v4(), title text not null, description text, content jsonb default '{}', difficulty text default 'facil', xp_reward int default 100, gem_reward int default 0, category text default 'frontend', type text default 'permanent', is_active boolean default true);

alter table public.profiles add column if not exists avatar_preset text default 'neo-hacker';
alter table public.profiles add column if not exists avatar_skin text default '#F4C7A1';
alter table public.profiles add column if not exists avatar_hair text default '#6E3CFF';
alter table public.profiles add column if not exists avatar_hat text default 'none';
alter table public.profiles add column if not exists avatar_top text default 'hoodie';
alter table public.profiles add column if not exists avatar_shoes text default 'sneakers';

alter table public.profiles enable row level security;alter table public.tracks enable row level security;alter table public.lessons enable row level security;alter table public.user_track_progress enable row level security;alter table public.user_lesson_progress enable row level security;alter table public.xp_history enable row level security;alter table public.rankings enable row level security;alter table public.missions enable row level security;alter table public.achievements enable row level security;alter table public.devtags enable row level security;alter table public.challenges enable row level security;

drop policy if exists profiles_select on public.profiles;create policy profiles_select on public.profiles for select using (true);
drop policy if exists profiles_insert on public.profiles;create policy profiles_insert on public.profiles for insert with check (auth.uid()=user_id);
drop policy if exists profiles_update on public.profiles;create policy profiles_update on public.profiles for update using (auth.uid()=user_id);
drop policy if exists tracks_select on public.tracks;create policy tracks_select on public.tracks for select using (true);
drop policy if exists lessons_select on public.lessons;create policy lessons_select on public.lessons for select using (true);
drop policy if exists utp_select on public.user_track_progress;create policy utp_select on public.user_track_progress for select using (auth.uid()=user_id);
drop policy if exists utp_insert on public.user_track_progress;create policy utp_insert on public.user_track_progress for insert with check (auth.uid()=user_id);
drop policy if exists utp_update on public.user_track_progress;create policy utp_update on public.user_track_progress for update using (auth.uid()=user_id);
drop policy if exists ulp_select on public.user_lesson_progress;create policy ulp_select on public.user_lesson_progress for select using (auth.uid()=user_id);
drop policy if exists ulp_insert on public.user_lesson_progress;create policy ulp_insert on public.user_lesson_progress for insert with check (auth.uid()=user_id);
drop policy if exists ulp_update on public.user_lesson_progress;create policy ulp_update on public.user_lesson_progress for update using (auth.uid()=user_id);
drop policy if exists rankings_select on public.rankings;create policy rankings_select on public.rankings for select using (true);
drop policy if exists rankings_insert on public.rankings;create policy rankings_insert on public.rankings for insert with check (auth.uid()=user_id);
drop policy if exists rankings_update on public.rankings;create policy rankings_update on public.rankings for update using (auth.uid()=user_id);
drop policy if exists xph_select on public.xp_history;create policy xph_select on public.xp_history for select using (auth.uid()=user_id);
drop policy if exists xph_insert on public.xp_history;create policy xph_insert on public.xp_history for insert with check (auth.uid()=user_id);
drop policy if exists public_read_missions on public.missions;create policy public_read_missions on public.missions for select using (true);
drop policy if exists public_read_achievements on public.achievements;create policy public_read_achievements on public.achievements for select using (true);
drop policy if exists public_read_devtags on public.devtags;create policy public_read_devtags on public.devtags for select using (true);
drop policy if exists public_read_challenges on public.challenges;create policy public_read_challenges on public.challenges for select using (true);

create or replace function public.calculate_level(xp int) returns int language plpgsql as $$ begin return greatest(1, floor(1 + sqrt(xp::float / 100))); end; $$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(user_id,username,avatar_url,level,xp_total,gems,streak,onboarding_completed) values(new.id,coalesce(new.raw_user_meta_data->>'user_name',split_part(new.email,'@',1)),new.raw_user_meta_data->>'avatar_url',1,0,0,0,false) on conflict(user_id) do nothing;
  insert into public.rankings(user_id,xp_total,level,streak) values(new.id,0,1,0) on conflict(user_id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.start_track(p_user_id uuid,p_track_id uuid) returns public.user_track_progress language plpgsql security definer as $$
declare first_lesson public.lessons%rowtype; progress public.user_track_progress%rowtype;
begin
  select * into first_lesson from public.lessons where track_id=p_track_id and is_active=true order by order_index asc limit 1;
  if first_lesson.id is null then raise exception 'Nenhuma licao ativa encontrada para esta trilha.'; end if;
  update public.profiles set selected_track_id=p_track_id where user_id=p_user_id;
  insert into public.user_track_progress(user_id,track_id,progress_percent,xp_earned,current_lesson_id,lessons_completed,is_completed)
  values(p_user_id,p_track_id,0,0,first_lesson.id,0,false)
  on conflict(user_id,track_id) do update set current_lesson_id=coalesce(public.user_track_progress.current_lesson_id,excluded.current_lesson_id)
  returning * into progress;
  insert into public.user_lesson_progress(user_id,lesson_id,track_id,status) select p_user_id,id,p_track_id,case when id=first_lesson.id then 'available' else 'locked' end from public.lessons where track_id=p_track_id and is_active=true on conflict(user_id,lesson_id) do nothing;
  return progress;
end; $$;

create or replace function public.add_xp(p_user_id uuid,p_amount int,p_source text,p_source_id uuid default null,p_description text default null) returns jsonb language plpgsql security definer as $$
declare old_xp int; old_level int; new_xp int; new_level int;
begin
  select xp_total,level into old_xp,old_level from public.profiles where user_id=p_user_id;
  new_xp:=coalesce(old_xp,0)+p_amount; new_level:=public.calculate_level(new_xp);
  update public.profiles set xp_total=new_xp,level=new_level where user_id=p_user_id;
  update public.rankings set xp_total=new_xp,level=new_level,updated_at=now() where user_id=p_user_id;
  insert into public.xp_history(user_id,amount,source,source_id,description) values(p_user_id,p_amount,p_source,p_source_id,p_description);
  return jsonb_build_object('new_xp',new_xp,'new_level',new_level,'leveled_up',new_level>coalesce(old_level,1),'xp_added',p_amount);
end; $$;

create or replace function public.complete_lesson(p_user_id uuid,p_lesson_id uuid,p_score int default 100) returns jsonb language plpgsql security definer as $$
declare l public.lessons%rowtype; old_status text; nxt public.lessons%rowtype; total int; completed int; percent int; xp jsonb; xp_added int:=0;
begin
  select * into l from public.lessons where id=p_lesson_id; if l.id is null then raise exception 'Lição não encontrada'; end if;
  select status into old_status from public.user_lesson_progress where user_id=p_user_id and lesson_id=p_lesson_id;
  if old_status is null or old_status='locked' then raise exception 'Lição bloqueada'; end if;
  if old_status='completed' then
    select count(*) into total from public.lessons where track_id=l.track_id and is_active=true;
    select count(*) into completed from public.user_lesson_progress where user_id=p_user_id and track_id=l.track_id and status='completed';
    percent:=case when total=0 then 0 else floor((completed::float/total::float)*100) end;
    return jsonb_build_object('already_completed',true,'xp_added',0,'new_xp',(select xp_total from profiles where user_id=p_user_id),'new_level',(select level from profiles where user_id=p_user_id),'leveled_up',false,'progress_percent',percent);
  end if;
  update public.user_lesson_progress set status='completed',score=p_score,attempts=attempts+1,xp_earned=l.xp_reward,completed_at=now() where user_id=p_user_id and lesson_id=p_lesson_id;
  select * into nxt from public.lessons where track_id=l.track_id and order_index>l.order_index and is_active=true order by order_index asc limit 1;
  if nxt.id is not null then update public.user_lesson_progress set status='available' where user_id=p_user_id and lesson_id=nxt.id and status='locked'; end if;
  select count(*) into total from public.lessons where track_id=l.track_id and is_active=true;
  select count(*) into completed from public.user_lesson_progress where user_id=p_user_id and track_id=l.track_id and status='completed';
  percent:=case when total=0 then 0 else floor((completed::float/total::float)*100) end;
  update public.user_track_progress set lessons_completed=completed,progress_percent=percent,xp_earned=xp_earned+l.xp_reward,current_lesson_id=coalesce(nxt.id,p_lesson_id),is_completed=(percent>=100),completed_at=case when percent>=100 then now() else null end where user_id=p_user_id and track_id=l.track_id;
  xp:=public.add_xp(p_user_id,l.xp_reward,'lesson',p_lesson_id,'Lição concluída: '||l.title);
  return xp || jsonb_build_object('already_completed',false,'next_lesson_id',nxt.id,'progress_percent',percent);
end; $$;

insert into public.tracks(slug,title,description,long_description,difficulty,icon,color,total_lessons,total_xp,order_index,tags) values
('html','HTML','Estruture páginas web com semântica.','Comece do zero com HTML, tags, atributos, listas, links, imagens e formulários.','iniciante','🌐','#E44D26',6,450,1,array['frontend','web']),
('css','CSS','Crie interfaces bonitas e responsivas.','Aprenda seletores, box model, flexbox, grid e animações.','iniciante','🎨','#2965F1',6,540,2,array['frontend','design']),
('javascript','JavaScript','Adicione lógica e interatividade.','Domine variáveis, funções, DOM, eventos e projetos práticos.','iniciante','⚡','#F7DF1E',6,650,3,array['frontend','logic']),
('react','React','Componentize interfaces modernas.','Componentes, props, estado, hooks e consumo de APIs.','intermediario','⚛️','#61DAFB',6,750,4,array['frontend']),
('typescript','TypeScript','Código mais seguro e profissional.','Tipos, interfaces, generics e padrões modernos.','intermediario','🔷','#3178C6',5,620,5,array['frontend','backend']),
('nodejs','Node.js','Backend com JavaScript.','APIs, rotas, banco e autenticação.','intermediario','🟢','#3C873A',5,700,6,array['backend']),
('python','Python','Automação e lógica poderosa.','Sintaxe, estruturas, funções e projetos.','iniciante','🐍','#FFD43B',5,550,7,array['backend','automation']),
('git','Git/GitHub','Controle versão como dev profissional.','Commits, branches, pull requests e deploy.','iniciante','🔀','#F05032',4,320,8,array['tools']),
('apis','APIs','Conecte sistemas reais.','HTTP, JSON, REST, fetch e autenticação.','intermediario','🔌','#4DBBFF',5,600,9,array['backend']),
('banco-de-dados','Banco de Dados','Modele e consulte dados.','SQL, relacionamentos, filtros e Supabase.','intermediario','🗄️','#9B6FFF',5,620,10,array['backend']),
('ui-ux','UI/UX','Crie experiências claras e premium.','Wireframes, hierarquia visual, componentes, interação e acessibilidade.','iniciante','✨','#FF8C42',5,540,11,array['design','frontend']),
('seguranca-web','Segurança Web','Proteja aplicações modernas.','Autenticação, autorização, OWASP, validação e boas práticas.','intermediario','🛡️','#2ECC71',5,640,12,array['backend','security'])
on conflict(slug) do update set title=excluded.title,description=excluded.description,total_lessons=excluded.total_lessons,total_xp=excluded.total_xp;

insert into public.lessons(track_id,title,description,content,xp_reward,order_index,type) select t.id,x.title,x.description,x.content::jsonb,x.xp,x.ord,x.type from public.tracks t join (values
('html','Introdução ao HTML','Entenda a estrutura principal de uma página.','[{"title":"HTML é estrutura","text":"Use tags para organizar conteúdo. Toda página costuma ter html, head e body."}]',50,1,'teoria'),
('html','Tags essenciais','Aprenda h1, p, img, a, main e section.','[{"title":"Tags semânticas","text":"Use main para conteúdo principal, h1 para título e p para parágrafos."}]',75,2,'codigo'),
('html','Atributos','Use href, src, alt e target corretamente.','[{"title":"Atributos","text":"Atributos adicionam informações às tags, como links e textos alternativos."}]',75,3,'codigo'),
('html','Listas e links','Crie navegação e listas organizadas.','[{"title":"Listas","text":"ul cria lista não ordenada, ol cria lista ordenada e li cria itens."}]',80,4,'codigo'),
('html','Formulários','Inputs, labels e validação básica.','[{"title":"Formulários","text":"Labels melhoram acessibilidade e inputs recebem dados."}]',90,5,'codigo'),
('html','Projeto HTML','Monte uma página completa.','[{"title":"Boss HTML","text":"Junte tudo em uma página semântica."}]',120,6,'projeto'),
('css','Introdução ao CSS','Seletores, cores e fontes.','[{"title":"CSS visual","text":"CSS controla aparência, espaçamento e layout."}]',60,1,'teoria'),
('css','Box Model','Margin, border, padding e content.','[{"title":"Caixas","text":"Todo elemento pode ser entendido como uma caixa."}]',80,2,'codigo'),
('css','Flexbox','Layouts flexíveis.','[{"title":"Flexbox","text":"display flex facilita alinhamento e distribuição."}]',100,3,'codigo'),
('javascript','Variáveis e tipos','Guarde valores e manipule dados.','[{"title":"JS básico","text":"Use let, const e tipos primitivos."}]',80,1,'codigo'),
('react','Componentes','Crie interfaces reutilizáveis.','[{"title":"Componente","text":"Um componente é uma função que retorna UI."}]',100,1,'codigo'),
('typescript','Tipos básicos','Adicione segurança aos dados.','[{"title":"Tipos","text":"TypeScript previne muitos erros antes de rodar."}]',90,1,'codigo'),
('nodejs','Servidor HTTP','Comece no backend.','[{"title":"Node","text":"Node executa JavaScript fora do navegador."}]',100,1,'codigo'),
('python','Sintaxe inicial','Primeiros passos com Python.','[{"title":"Python","text":"Python tem sintaxe simples para lógica e automação."}]',80,1,'codigo'),
('git','Primeiro commit','Versione seu projeto.','[{"title":"Git","text":"Commits salvam pontos da história do projeto."}]',70,1,'teoria'),
('apis','HTTP e JSON','Entenda requests e responses.','[{"title":"APIs","text":"APIs conectam seu front ao backend."}]',100,1,'teoria'),
('banco-de-dados','Tabelas SQL','Organize dados em tabelas.','[{"title":"Banco","text":"Tabelas guardam registros com colunas."}]',100,1,'teoria'),
('ui-ux','Fundamentos UI','Entenda hierarquia visual e consistência.','[{"title":"UI/UX","text":"Boa interface guia o usuário com clareza, contraste e ritmo visual."}]',80,1,'teoria'),
('ui-ux','Componentes premium','Crie cards, chips e estados consistentes.','[{"title":"Sistema visual","text":"Reaproveite padrões para deixar a interface previsível e elegante."}]',95,2,'codigo'),
('ui-ux','Acessibilidade','Construa telas inclusivas.','[{"title":"A11y","text":"Use contraste, foco visível e texto legível em todas as telas."}]',100,3,'codigo'),
('ui-ux','Prototipação','Transforme ideia em fluxo visual.','[{"title":"Fluxo","text":"Mapeie o caminho do usuário antes de construir a interface final."}]',110,4,'projeto'),
('ui-ux','Projeto UI','Monte uma tela premium completa.','[{"title":"Boss UI","text":"Junte layout, navegação e feedback visual em uma peça coesa."}]',150,5,'projeto'),
('seguranca-web','Autenticação segura','Valide login e sessão corretamente.','[{"title":"Auth","text":"Fluxos seguros dependem de cookies, tokens e redirecionamentos corretos."}]',90,1,'teoria'),
('seguranca-web','OWASP básico','Conheça as principais ameaças web.','[{"title":"OWASP","text":"Proteja contra XSS, CSRF, SQLi e exposição de dados sensíveis."}]',110,2,'teoria'),
('seguranca-web','Validação de entrada','Nunca confie no input do usuário.','[{"title":"Validation","text":"Sanitizar e validar entradas reduz superfícies de ataque."}]',120,3,'codigo'),
('seguranca-web','Headers e políticas','Use defesas no navegador e no servidor.','[{"title":"Security headers","text":"CSP, HSTS e outras políticas reforçam a aplicação."}]',130,4,'codigo'),
('seguranca-web','Checklist final','Faça o hardening da sua aplicação.','[{"title":"Hardening","text":"Revise permissões, logs e segredos antes do deploy."}]',160,5,'projeto')
) as x(slug,title,description,content,xp,ord,type) on t.slug=x.slug
on conflict do nothing;

insert into public.missions(title,description,type,xp_reward,requirement_type,requirement_value,icon) values ('Complete 1 lição','Avance uma fase hoje','daily',100,'complete_lessons',1,'📖'),('Mantenha seu streak','Entre e pratique hoje','daily',50,'maintain_streak',1,'🔥') on conflict do nothing;
insert into public.achievements(slug,title,description,icon,rarity,requirement_type,requirement_value) values ('primeira-licao','Primeira Lição','Conclua sua primeira lição','🏅','common','lessons_completed',1),('html-hero','HTML Hero','Complete a trilha HTML','🌐','rare','track_completed',1) on conflict(slug) do nothing;
insert into public.devtags(slug,name,description,icon,requirement_type,requirement_value) values ('html-hero','HTML Hero','Mestre dos elementos HTML','🌐','track_html',1),('bug-hunter','Bug Hunter','Corrigiu vários erros','🐞','fix_errors',10) on conflict(slug) do nothing;
insert into public.challenges(title,description,difficulty,xp_reward,category,type) values ('Landing Page Responsiva','Crie uma landing page completa','dificil',400,'frontend','permanent'),('Menu Animado','Crie um menu com animação','medio',250,'frontend','daily'),('Formulário Completo','Monte um formulário acessível','facil',150,'frontend','permanent') on conflict do nothing;
