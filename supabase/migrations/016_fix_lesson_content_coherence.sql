-- Corrige acentuação e reforça coerência das primeiras lições das trilhas finais.
-- Não altera XP, progresso, visual, ids ou histórico de usuários.

create or replace function public.cq_normalize_pt(value text)
returns text
language plpgsql
immutable
as $$
declare
  result text := value;
  pair text[];
begin
  if result is null then
    return null;
  end if;

  foreach pair slice 1 in array array[
    array['Basico','Básico'], array['basico','básico'],
    array['Funcoes','Funções'], array['funcoes','funções'],
    array['Variaveis','Variáveis'], array['variaveis','variáveis'],
    array['Colecoes','Coleções'], array['colecoes','coleções'],
    array['Excecoes','Exceções'], array['excecoes','exceções'],
    array['Persistencia','Persistência'], array['persistencia','persistência'],
    array['Seguranca','Segurança'], array['seguranca','segurança'],
    array['Autenticacao','Autenticação'], array['autenticacao','autenticação'],
    array['Autorizacao','Autorização'], array['autorizacao','autorização'],
    array['Validacao','Validação'], array['validacao','validação'],
    array['Relatorio','Relatório'], array['relatorio','relatório'],
    array['Publicacao','Publicação'], array['publicacao','publicação'],
    array['Avaliacao','Avaliação'], array['avaliacao','avaliação'],
    array['Producao','Produção'], array['producao','produção'],
    array['Informacao','Informação'], array['informacao','informação'],
    array['pagina','página'], array['conteudo','conteúdo'],
    array['semantico','semântico'], array['paragrafos','parágrafos'],
    array['acoes','ações'], array['basica','básica'],
    array['codigo','código'], array['logica','lógica'],
    array['aplicacao','aplicação'], array['aplicacoes','aplicações'],
    array['configuracoes','configurações'], array['navegacao','navegação'],
    array['usuarios','usuários'], array['usuario','usuário'],
    array['preferencias','preferências'], array['interacoes','interações'],
    array['operacoes','operações'], array['regioes','regiões'],
    array['metricas','métricas'], array['dependencias','dependências'],
    array['licao','lição'], array['licoes','lições'],
    array['missao','missão'], array['missoes','missões']
  ] loop
    result := replace(result, pair[1], pair[2]);
  end loop;

  return result;
end;
$$;

update public.lessons l
set
  title = public.cq_normalize_pt(l.title),
  description = public.cq_normalize_pt(l.description),
  content = public.cq_normalize_pt(l.content::text)::jsonb
from public.tracks t
where t.id = l.track_id
  and t.slug in (
    'frontend',
    'backend',
    'python',
    'java',
    'php',
    'cybersecurity',
    'ai-engineer',
    'mobile',
    'devops',
    'game-development'
  );

with first_lessons(slug, title, description, content) as (
  values
  ('frontend', 'HTML Básico', 'Estruture uma página com head, body e conteúdo semântico.', '[{"module":"Frontend","chapter":"HTML","title":"Documento web","text":"HTML é a linguagem de marcação que estrutura páginas. Ele organiza títulos, textos, links, imagens, formulários e áreas semânticas antes de qualquer estilo ou JavaScript.","challenge":"Crie uma página com <!doctype html>, html, head, title, body, main, h1 e p.","validation":"validar estrutura HTML semântica","difficulty":"básico","quest":"Mapa inicial do navegador"}]'::jsonb),
  ('backend', 'Node.js Básico', 'Entenda runtime, servidor HTTP e resposta JSON.', '[{"module":"Backend","chapter":"Node.js","title":"Servidor inicial","text":"Backend cuida das regras, dados e respostas que a interface consome. Com Node.js, JavaScript roda no servidor para criar rotas HTTP, validar entradas e retornar JSON.","challenge":"Crie uma rota GET /status que responda JSON com ok true.","validation":"validar rota HTTP e JSON","difficulty":"básico","quest":"Servidor inicial"}]'::jsonb),
  ('python', 'Python Básico', 'Escreva variáveis, funções e saída no terminal.', '[{"module":"Python","chapter":"Sintaxe","title":"Primeiro script","text":"Python é uma linguagem clara para automação, dados, APIs e IA. Comece com variáveis, print, funções e indentação correta.","challenge":"Crie um script com uma função saudacao(nome) que retorna uma mensagem.","validation":"validar def, return e print","difficulty":"básico","quest":"Script inicial"}]'::jsonb),
  ('java', 'Java Básico', 'Entenda classe Main, tipos e saída no console.', '[{"module":"Java","chapter":"Sintaxe","title":"Primeiro programa","text":"Java organiza código em classes e métodos. Um programa básico usa class Main, public static void main e System.out.println para escrever no console.","challenge":"Crie uma Main que imprime CodeQuest Java.","validation":"validar classe Main e saída no console","difficulty":"básico","quest":"JVM inicial"}]'::jsonb),
  ('php', 'PHP Básico', 'Entenda tags PHP, variáveis e echo.', '[{"module":"PHP","chapter":"Sintaxe","title":"Servidor dinâmico","text":"PHP roda no servidor e pode gerar HTML ou respostas dinâmicas. Comece abrindo <?php, criando variáveis e usando echo para escrever conteúdo.","challenge":"Crie uma página PHP que mostra o nome do estudante com echo.","validation":"validar tag PHP, variável e echo","difficulty":"básico","quest":"Script inicial"}]'::jsonb),
  ('cybersecurity', 'Linux Básico', 'Navegue, leia arquivos e use permissões com segurança.', '[{"module":"Cybersecurity","chapter":"Linux","title":"Terminal seguro","text":"Linux é base de servidores e laboratórios de segurança. Aprenda comandos de navegação, leitura de arquivos e permissões sempre em ambiente autorizado.","challenge":"Monte um checklist com pwd, ls, cat e chmod explicando uso seguro.","validation":"validar comandos e cuidados de autorização","difficulty":"básico","quest":"Terminal base"}]'::jsonb),
  ('ai-engineer', 'Python para IA', 'Prepare scripts, funções e ambiente para projetos de IA.', '[{"module":"AI Engineer","chapter":"Base","title":"Python aplicado","text":"Produtos de IA precisam de código organizado, dados rastreáveis e ambiente reproduzível. Python é a base para preparar datasets, prompts, avaliações e integrações.","challenge":"Crie um plano com dados, avaliação e fallback para um tutor de IA.","validation":"validar dados, avaliação e fallback","difficulty":"básico","quest":"Kernel inicial"}]'::jsonb),
  ('mobile', 'Mobile Básico', 'Entenda telas, componentes, toque e área segura.', '[{"module":"Mobile","chapter":"UI","title":"Tela pequena","text":"Mobile exige hierarquia clara, toque confortável, área segura, estados rápidos e navegação simples. A primeira tela deve priorizar a ação principal.","challenge":"Desenhe uma tela com título, lista de lições e botão iniciar respeitando área segura.","validation":"validar estrutura mobile e toque confortável","difficulty":"básico","quest":"Viewport de bolso"}]'::jsonb),
  ('devops', 'Linux e Shell', 'Automatize tarefas com comandos e scripts.', '[{"module":"DevOps","chapter":"Linux","title":"Base operacional","text":"DevOps começa no terminal: navegar arquivos, ler logs, configurar variáveis e automatizar tarefas repetíveis com scripts seguros.","challenge":"Crie um roteiro com build, test e deploy para uma aplicação simples.","validation":"validar etapas de automação","difficulty":"básico","quest":"Console operacional"}]'::jsonb),
  ('game-development', 'Game Loop', 'Entenda update, render, input e tempo.', '[{"module":"Game Development","chapter":"Fundamentos","title":"Coração do jogo","text":"Todo jogo alterna entrada do jogador, atualização de estado e renderização. O game loop mantém movimento, colisão, HUD e feedback sincronizados.","challenge":"Crie um esboço com input, update(delta) e render().","validation":"validar loop principal do jogo","difficulty":"básico","quest":"Motor inicial"}]'::jsonb)
)
update public.lessons l
set
  title = first_lessons.title,
  description = first_lessons.description,
  content = first_lessons.content
from public.tracks t
join first_lessons on first_lessons.slug = t.slug
where l.track_id = t.id
  and l.order_index = 1;

drop function public.cq_normalize_pt(text);
