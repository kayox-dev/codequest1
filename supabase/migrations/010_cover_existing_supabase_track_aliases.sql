insert into public.tracks(slug,title,description,long_description,difficulty,icon,color,total_lessons,total_xp,order_index,tags)
values
  ('database','Banco de Dados','Modele, consulte e proteja dados reais.','Roadmap completo de SQL, relacionamentos, joins, indices, RLS, Supabase e modelagem de produto.','intermediario','DB','#9B6FFF',9,0,10,array['backend','database','roadmap']),
  ('uiux','UI/UX Design','Crie experiencias claras, acessiveis e premium.','Roadmap completo de fundamentos visuais, wireframes, componentes, prototipos, testes, acessibilidade e design system.','iniciante','UX','#FF8C42',9,0,11,array['design','frontend','roadmap']),
  ('security','Seguranca Web','Proteja aplicacoes modernas do login ao deploy.','Roadmap completo de autenticacao, autorizacao, OWASP, validacao, headers, segredos, auditoria e hardening.','intermediario','SEC','#2ECC71',9,0,12,array['backend','security','roadmap'])
on conflict(slug) do update set
  title=excluded.title,
  description=excluded.description,
  long_description=excluded.long_description,
  difficulty=excluded.difficulty,
  icon=excluded.icon,
  color=excluded.color,
  tags=excluded.tags,
  is_active=true;

do $$
declare
  item record;
  v_track_id uuid;
  v_lesson_id uuid;
begin
  for item in
    select * from (values
      ('database','SQL Basico','Entenda tabelas, colunas e registros.','[{"module":"Banco de Dados","chapter":"SQL","title":"Dados tabulares","text":"Bancos relacionais organizam informacoes em tabelas com colunas e linhas.","challenge":"Modele uma tabela de trilhas com id, titulo e xp_total.","validation":"validar tabela, colunas e tipos","difficulty":"basico","quest":"Mapa das tabelas"}]',100,1,1,'teoria',16,false),
      ('database','SELECT e Filtros','Busque dados com where, order by e limit.','[{"module":"Banco de Dados","chapter":"Consultas","title":"Busca precisa","text":"SELECT recupera apenas os dados necessarios quando filtros e ordenacao sao bem usados.","challenge":"Liste licoes ativas ordenadas por order_index.","validation":"validar select, where e order by","difficulty":"basico","quest":"Lupa SQL"}]',120,1,2,'codigo',20,false),
      ('database','Relacionamentos','Conecte entidades com chaves primarias e estrangeiras.','[{"module":"Banco de Dados","chapter":"Modelagem","title":"Relacoes confiaveis","text":"Chaves conectam usuarios, trilhas, licoes e progresso sem duplicar dados.","challenge":"Modele trilhas e licoes com foreign key.","validation":"validar primary key e foreign key","difficulty":"intermediario","quest":"Pontes relacionais"}]',135,1,3,'codigo',22,false),
      ('database','Joins','Combine dados de tabelas relacionadas.','[{"module":"Banco de Dados","chapter":"Consultas","title":"Dados conectados","text":"JOIN permite montar respostas completas a partir de tabelas normalizadas.","challenge":"Liste licoes com o titulo da trilha correspondente.","validation":"validar join e on","difficulty":"intermediario","quest":"Encontro de tabelas"}]',150,2,4,'codigo',24,false),
      ('database','Insert e Update','Grave e altere dados com seguranca.','[{"module":"Banco de Dados","chapter":"Escrita","title":"Mudancas controladas","text":"Escritas precisam de validacao, filtros e cuidado com conflitos.","challenge":"Insira uma licao e atualize seu XP com where.","validation":"validar insert, update e filtro","difficulty":"intermediario","quest":"Forja dos registros"}]',155,2,5,'codigo',26,false),
      ('database','Indices','Melhore performance de consultas frequentes.','[{"module":"Banco de Dados","chapter":"Performance","title":"Caminhos rapidos","text":"Indices aceleram buscas comuns quando escolhidos com criterio.","challenge":"Crie indice para busca por track_id e order_index.","validation":"validar create index","difficulty":"avancado","quest":"Atalho de consulta"}]',170,2,6,'codigo',28,false),
      ('database','RLS e Policies','Proteja dados por usuario no Supabase.','[{"module":"Banco de Dados","chapter":"Seguranca","title":"Acesso por dono","text":"Row Level Security impede que um usuario leia ou altere dados de outro.","challenge":"Crie policy de select usando auth.uid() = user_id.","validation":"validar enable rls e policy","difficulty":"avancado","quest":"Escudo RLS"}]',190,2,7,'codigo',32,false),
      ('database','Supabase Realtime','Planeje eventos e sincronizacao de dados.','[{"module":"Banco de Dados","chapter":"Supabase","title":"Dados vivos","text":"Realtime permite refletir mudancas sem recarregar a tela.","challenge":"Desenhe fluxo de progresso atualizado em tempo real.","validation":"validar canal, evento e estado","difficulty":"avancado","quest":"Sinal em tempo real"}]',195,2,8,'codigo',34,false),
      ('database','Boss Database','Modele o banco completo de uma plataforma de aprendizado.','[{"module":"Banco de Dados","chapter":"Boss","title":"Schema CodeQuest","text":"Una tabelas, consultas, relacionamentos, escrita, indices, RLS e Supabase.","challenge":"Entregue schema com usuarios, trilhas, licoes, progresso, recompensas e policies.","validation":"validar banco completo","difficulty":"avancado","quest":"Boss dos dados"}]',290,5,9,'projeto',52,true),

      ('uiux','Fundamentos Visuais','Use hierarquia, contraste e alinhamento.','[{"module":"UI/UX","chapter":"Fundamentos","title":"Clareza visual","text":"Uma boa interface mostra o que importa primeiro e reduz ruido.","challenge":"Organize uma tela com titulo, acao principal e conteudo escaneavel.","validation":"validar hierarquia e contraste","difficulty":"basico","quest":"Olhar do usuario"}]',95,1,1,'teoria',15,false),
      ('uiux','Pesquisa e Persona','Entenda objetivos, dores e contexto de uso.','[{"module":"UI/UX","chapter":"Pesquisa","title":"Usuario real","text":"UX comeca entendendo quem usa, por que usa e onde encontra atrito.","challenge":"Crie persona e objetivo para uma jornada de aprendizado.","validation":"validar persona, contexto e objetivo","difficulty":"basico","quest":"Mapa de empatia"}]',110,1,2,'codigo',18,false),
      ('uiux','Wireframes','Desenhe fluxo antes do visual final.','[{"module":"UI/UX","chapter":"Fluxo","title":"Estrutura primeiro","text":"Wireframes ajudam a testar ordem, navegacao e conteudo sem polimento precoce.","challenge":"Crie wireframe textual para lista de trilhas e detalhe da missao.","validation":"validar telas e fluxo","difficulty":"basico","quest":"Esqueleto da tela"}]',125,1,3,'codigo',20,false),
      ('uiux','Componentes','Crie botoes, cards, inputs e estados consistentes.','[{"module":"UI/UX","chapter":"Sistema","title":"Pecas reutilizaveis","text":"Componentes consistentes tornam o produto previsivel e rapido de evoluir.","challenge":"Defina variantes de botao, card de trilha e input com erro.","validation":"validar componentes e estados","difficulty":"intermediario","quest":"Kit de interface"}]',145,2,4,'codigo',24,false),
      ('uiux','Prototipagem','Conecte telas com interacoes e feedback.','[{"module":"UI/UX","chapter":"Prototipo","title":"Fluxo clicavel","text":"Prototipos revelam falhas de navegacao antes da implementacao.","challenge":"Monte fluxo de escolher trilha, iniciar missao e ver progresso.","validation":"validar fluxo completo","difficulty":"intermediario","quest":"Portal clicavel"}]',155,2,5,'codigo',26,false),
      ('uiux','Acessibilidade UX','Projete foco, leitura, contraste e mensagens claras.','[{"module":"UI/UX","chapter":"Acessibilidade","title":"Interface inclusiva","text":"Acessibilidade e parte da experiencia, nao um extra no fim.","challenge":"Revise uma tela para teclado, contraste e mensagens de erro.","validation":"validar a11y checklist","difficulty":"intermediario","quest":"Rota inclusiva"}]',165,2,6,'codigo',28,false),
      ('uiux','Teste de Usabilidade','Observe atritos e transforme em melhoria.','[{"module":"UI/UX","chapter":"Teste","title":"Aprender observando","text":"Testes pequenos revelam confusoes reais em fluxo, texto e acoes.","challenge":"Crie roteiro de teste com tarefas e criterios de sucesso.","validation":"validar roteiro e metricas","difficulty":"avancado","quest":"Laboratorio UX"}]',175,2,7,'codigo',30,false),
      ('uiux','Design System','Documente tokens, componentes e padroes.','[{"module":"UI/UX","chapter":"Sistema","title":"Produto escalavel","text":"Design system reduz variacao e protege consistencia visual.","challenge":"Defina tokens, componentes principais e regras de uso.","validation":"validar tokens e documentacao","difficulty":"avancado","quest":"Biblioteca premium"}]',190,2,8,'codigo',34,false),
      ('uiux','Boss UI/UX','Entregue o fluxo premium de uma plataforma de aprendizado.','[{"module":"UI/UX","chapter":"Boss","title":"Experiencia CodeQuest","text":"Una fundamentos, pesquisa, wireframes, componentes, prototipo, acessibilidade, teste e design system.","challenge":"Crie o fluxo completo de trilhas, missoes, progresso e recompensa.","validation":"validar experiencia completa","difficulty":"avancado","quest":"Boss da experiencia"}]',275,5,9,'projeto',50,true),

      ('security','Autenticacao','Proteja login, sessao e recuperacao de acesso.','[{"module":"Seguranca Web","chapter":"Auth","title":"Identidade segura","text":"Autenticacao confirma quem esta usando o sistema e precisa resistir a abuso.","challenge":"Desenhe fluxo seguro com sessao, expiracao e erro claro.","validation":"validar login, sessao e expiracao","difficulty":"basico","quest":"Portao de identidade"}]',105,1,1,'teoria',16,false),
      ('security','Autorizacao','Separe permissoes por usuario, papel e recurso.','[{"module":"Seguranca Web","chapter":"Permissoes","title":"Acesso minimo","text":"Depois do login, cada acao ainda precisa verificar permissao.","challenge":"Modele regra que permite editar apenas o proprio progresso.","validation":"validar ownership e roles","difficulty":"basico","quest":"Chave de acesso"}]',125,1,2,'codigo',20,false),
      ('security','OWASP Top 10','Reconheca riscos recorrentes em apps web.','[{"module":"Seguranca Web","chapter":"OWASP","title":"Mapa de riscos","text":"OWASP ajuda a priorizar falhas comuns como XSS, SQLi e controle de acesso quebrado.","challenge":"Associe cinco riscos a mitigacoes praticas.","validation":"validar riscos e defesas","difficulty":"intermediario","quest":"Mapa OWASP"}]',145,2,3,'codigo',24,false),
      ('security','Validacao de Entrada','Bloqueie payloads invalidos antes da regra de negocio.','[{"module":"Seguranca Web","chapter":"Input","title":"Fronteira confiavel","text":"Validacao reduz bugs, abuso e exploracao de dados inesperados.","challenge":"Valide email, tamanho de texto e valores permitidos.","validation":"validar schema e mensagens","difficulty":"intermediario","quest":"Filtro de payload"}]',155,2,4,'codigo',26,false),
      ('security','XSS e Escape','Evite scripts injetados por conteudo de usuario.','[{"module":"Seguranca Web","chapter":"XSS","title":"Saida segura","text":"Nunca renderize HTML de usuario sem escape ou sanitizacao confiavel.","challenge":"Identifique ponto de XSS simulado e aplique escape.","validation":"validar escape e sanitizacao","difficulty":"intermediario","quest":"Escudo contra scripts"}]',170,2,5,'codigo',28,false),
      ('security','CSRF e Sessoes','Proteja acoes autenticadas em navegadores.','[{"module":"Seguranca Web","chapter":"Sessoes","title":"Requisicao intencional","text":"CSRF explora sessoes validas quando a origem nao e verificada.","challenge":"Explique mitigacoes com SameSite, token e metodo adequado.","validation":"validar CSRF e cookies","difficulty":"intermediario","quest":"Selo de origem"}]',175,2,6,'codigo',30,false),
      ('security','Headers de Seguranca','Use CSP, HSTS e politicas de navegador.','[{"module":"Seguranca Web","chapter":"Headers","title":"Defesa no navegador","text":"Headers reduzem impacto de falhas e endurecem a superficie web.","challenge":"Monte conjunto de headers para app em producao.","validation":"validar CSP, HSTS e frame options","difficulty":"avancado","quest":"Muralha HTTP"}]',190,2,7,'codigo',34,false),
      ('security','Segredos e Logs','Proteja chaves, variaveis e dados sensiveis.','[{"module":"Seguranca Web","chapter":"Operacao","title":"Segredo nao vaza","text":"Logs e envs mal cuidados expoem chaves e dados privados.","challenge":"Classifique variaveis publicas, privadas e dados que nao devem ir para log.","validation":"validar secrets e redaction","difficulty":"avancado","quest":"Cofre de segredos"}]',200,2,8,'codigo',36,false),
      ('security','Boss Security','Audite e endureca uma aplicacao web completa.','[{"module":"Seguranca Web","chapter":"Boss","title":"Hardening final","text":"Una auth, autorizacao, OWASP, validacao, XSS, CSRF, headers, segredos e logs.","challenge":"Entregue checklist priorizado com riscos, impacto, evidencia e correcao.","validation":"validar auditoria completa","difficulty":"avancado","quest":"Boss da seguranca"}]',295,5,9,'projeto',54,true)
    ) as lesson(slug,title,description,content,xp,gems,ord,type,minutes,is_boss)
  loop
    select id into v_track_id
    from public.tracks
    where slug = item.slug;

    if v_track_id is null then
      raise exception 'Track not found for slug %', item.slug;
    end if;

    select id into v_lesson_id
    from public.lessons
    where track_id = v_track_id
      and order_index = item.ord
      and is_active = true
    order by created_at asc, id asc
    limit 1;

    if v_lesson_id is null then
      insert into public.lessons(track_id,title,description,content,xp_reward,gem_reward,order_index,type,estimated_minutes,is_boss,is_active)
      values(v_track_id,item.title,item.description,item.content::jsonb,item.xp,item.gems,item.ord,item.type,item.minutes,item.is_boss,true);
    else
      update public.lessons
      set title = item.title,
          description = item.description,
          content = item.content::jsonb,
          xp_reward = item.xp,
          gem_reward = item.gems,
          type = item.type,
          estimated_minutes = item.minutes,
          is_boss = item.is_boss,
          is_active = true
      where id = v_lesson_id;
    end if;
  end loop;
end;
$$;

with last_active_lesson as (
  select distinct on (track_id)
    id,
    track_id
  from public.lessons
  where is_active = true
  order by track_id, order_index desc, created_at desc
),
tracks_without_boss as (
  select t.id as track_id, l.id as lesson_id
  from public.tracks t
  join last_active_lesson l on l.track_id = t.id
  where t.is_active = true
    and not exists (
      select 1
      from public.lessons b
      where b.track_id = t.id
        and b.is_active = true
        and b.is_boss = true
    )
)
update public.lessons l
set is_boss = true,
    type = 'projeto'
from tracks_without_boss missing
where l.id = missing.lesson_id;

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
