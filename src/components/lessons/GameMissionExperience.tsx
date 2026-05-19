'use client'

import Confetti from 'react-confetti'
import Editor from '@monaco-editor/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { AppShell } from '@/components/layout/AppShell'
import { AvatarFigure } from '@/components/shared/AvatarFigure'
import { supabase } from '@/lib/supabase'
import { lessonService } from '@/services/track.service'
import { useAppStore } from '@/store'
import type { Lesson, Track } from '@/types'

type MissionStage = 'briefing' | 'learn' | 'code'
type Tech = 'html' | 'css' | 'javascript' | 'typescript' | 'react' | 'node' | 'python' | 'sql' | 'git'
type ValidationResult = { ok: boolean; title: string; detail: string; kind: 'success' | 'warn' | 'error' }
type MissionFile = { id: string; label: string; language: string; value: string }

type ChallengeSpec = {
  tech: Tech
  badge: string
  focus: string
  objective: string
  expectedText?: string
  requiredTag?: string
  requiredAttrs?: string[]
  requiredCss?: string[]
  requiredJs?: string[]
  files: MissionFile[]
  solutionFiles: MissionFile[]
  concept: string
  useCase: string
  mentalModel: string
  hint: string
  demoTitle: string
  outputTitle: string
}

const fileById = (files: MissionFile[], id: string) => files.find((file) => file.id === id)?.value ?? ''
const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, ' ')
const techByTrackSlug: Record<string, Tech> = {
  html: 'html',
  css: 'css',
  javascript: 'javascript',
  react: 'react',
  typescript: 'typescript',
  nodejs: 'node',
  apis: 'node',
  python: 'python',
  git: 'git',
  'banco-de-dados': 'sql',
  'ui-ux': 'css',
  'seguranca-web': 'node',
}

function getInitialFileId(spec: ChallengeSpec) {
  return spec.files.find((file) => file.id === spec.focus || file.label === spec.focus)?.id ?? spec.files[0]?.id ?? ''
}

function detectTech(lesson: Lesson, track?: Track | null): Tech {
  if (track?.slug && techByTrackSlug[track.slug]) return techByTrackSlug[track.slug]

  const source = normalize(`${track?.slug ?? ''} ${track?.title ?? ''} ${lesson.title} ${lesson.description} ${JSON.stringify(lesson.content ?? '')}`)
  if (source.includes('react') || source.includes('jsx') || source.includes('hook') || source.includes('component')) return 'react'
  if (source.includes('typescript') || source.includes(' type') || source.includes('interface')) return 'typescript'
  if (source.includes('git') || source.includes('commit') || source.includes('branch') || source.includes('github')) return 'git'
  if (source.includes('banco') || source.includes('sql') || source.includes('supabase') || source.includes('tabela')) return 'sql'
  if (source.includes('node') || source.includes('api') || source.includes('apis') || source.includes('backend') || source.includes('express') || source.includes('json') || source.includes('http') || source.includes('rest') || source.includes('seguranca') || source.includes('auth') || source.includes('owasp')) return 'node'
  if (source.includes('python') || source.includes('py')) return 'python'
  if (source.includes('javascript') || source.includes('script') || source.includes('dom') || source.includes('array') || source.includes('func')) return 'javascript'
  if (source.includes('css') || source.includes('flex') || source.includes('grid') || source.includes('animacao') || source.includes('responsiv') || source.includes('ui') || source.includes('ux') || source.includes('design') || source.includes('acessibilidade')) return 'css'
  if (source.includes('html') || source.includes('tag') || source.includes('semantica')) return 'html'
  return 'javascript'
}

function getHtmlSpec(lesson: Lesson, conceptSource?: string): ChallengeSpec {
  const source = normalize(conceptSource ?? `${lesson.title} ${lesson.description} ${JSON.stringify(lesson.content ?? '')}`)
  const variants = [
    {
      tag: 'h1',
      text: 'CodeQuest',
      objective: 'Criar um heading principal H1 com o texto CodeQuest.',
      starter: '<main>\n  \n</main>',
      solution: '<main>\n  <h1>CodeQuest</h1>\n</main>',
      concept: 'Headings organizam a hierarquia do conteúdo. Use apenas um H1 como título principal da página.',
      hint: 'Use <h1>CodeQuest</h1> dentro do main.',
    },
    {
      tag: 'p',
      text: 'Minha primeira página',
      objective: 'Criar um parágrafo com o texto Minha primeira página.',
      starter: '<main>\n  <h1>CodeQuest</h1>\n  \n</main>',
      solution: '<main>\n  <h1>CodeQuest</h1>\n  <p>Minha primeira página</p>\n</main>',
      concept: 'A tag p representa parágrafos. Ela é usada para textos corridos, descrições e explicações.',
      hint: 'Abaixo do H1, crie <p>Minha primeira página</p>.',
    },
    {
      tag: 'img',
      attrs: ['src', 'alt'],
      text: '',
      objective: 'Criar uma imagem usando <img> com src e alt.',
      starter: '<main>\n  \n</main>',
      solution: '<main>\n  <img src="avatar.png" alt="Avatar do estudante" />\n</main>',
      concept: 'A tag img mostra imagens na página. O atributo src aponta o arquivo e alt descreve a imagem para acessibilidade.',
      hint: 'Use <img src="avatar.png" alt="Avatar do estudante" />.',
    },
    {
      tag: 'button',
      text: 'Entrar',
      objective: 'Criar um botão com o texto Entrar.',
      starter: '<main>\n  \n</main>',
      solution: '<main>\n  <button>Entrar</button>\n</main>',
      concept: 'Botões representam ações. Use button para cliques reais, não divs clicáveis.',
      hint: 'Abra <button>, escreva Entrar e feche com </button>.',
    },
    {
      tag: 'a',
      attrs: ['href'],
      text: 'Abrir trilha',
      objective: 'Criar um link com href e texto Abrir trilha.',
      starter: '<main>\n  \n</main>',
      solution: '<main>\n  <a href="/trilhas/html">Abrir trilha</a>\n</main>',
      concept: 'Links conectam paginas e recursos. O href define o destino da navegacao.',
      hint: 'Use <a href="/trilhas/html">Abrir trilha</a>.',
    },
    {
      tag: 'li',
      text: 'Primeira fase',
      objective: 'Criar uma lista com um item chamado Primeira fase.',
      starter: '<main>\n  <ul>\n    \n  </ul>\n</main>',
      solution: '<main>\n  <ul>\n    <li>Primeira fase</li>\n  </ul>\n</main>',
      concept: 'Listas agrupam itens relacionados. ul cria a lista e li cria cada item.',
      hint: 'Dentro de <ul>, crie <li>Primeira fase</li>.',
    },
    {
      tag: 'label',
      attrs: ['for'],
      text: 'Email',
      objective: 'Criar um campo de e-mail com label associado.',
      starter: '<main>\n  <form>\n    \n  </form>\n</main>',
      solution: '<main>\n  <form>\n    <label for="email">Email</label>\n    <input id="email" type="email" />\n  </form>\n</main>',
      concept: 'Formularios acessiveis conectam label e input, ajudando teclado e leitores de tela.',
      hint: 'Use label for="email" e input id="email" type="email".',
    },
    {
      tag: 'article',
      text: 'Noticia da trilha',
      objective: 'Criar uma estrutura semântica com article.',
      starter: '<main>\n  \n</main>',
      solution: '<main>\n  <article>\n    <h1>Noticia da trilha</h1>\n    <p>Conteudo principal organizado.</p>\n  </article>\n</main>',
      concept: 'Semântica dá significado ao conteúdo. article marca uma parte independente da página.',
      hint: 'Crie <article> com um titulo e um paragrafo dentro.',
    },
    {
      tag: 'table',
      text: 'Ranking',
      objective: 'Criar uma tabela com caption, thead e tbody.',
      starter: '<main>\n  \n</main>',
      solution: '<main>\n  <table>\n    <caption>Ranking</caption>\n    <thead><tr><th scope="col">Nome</th></tr></thead>\n    <tbody><tr><td>Ada</td></tr></tbody>\n  </table>\n</main>',
      concept: 'Tabelas organizam dados. caption e th com scope deixam a estrutura compreensivel.',
      hint: 'Use table, caption, thead, tbody e th scope="col".',
    },
  ]
  const picked =
    source.includes('heading') || source.includes('h1') || source.includes('h1-h6') || source.includes('titulo') || source.includes('título') ? variants[0] :
    source.includes('paragra') || source.includes(' tag p') || source.includes('<p') ? variants[1] :
    source.includes('img') || source.includes('imagem') || source.includes('midia') || source.includes('media') || source.includes('alt') ? variants[2] :
    source.includes('button') || source.includes('botao') || source.includes('botão') ? variants[3] :
    source.includes('link') || source.includes('href') ? variants[4] :
    source.includes('lista') || source.includes('<li') ? variants[5] :
    source.includes('form') || source.includes('input') || source.includes('label') ? variants[6] :
    source.includes('table') || source.includes('tabela') || source.includes('dados') ? variants[8] :
    source.includes('semant') || source.includes('article') || source.includes('header') || source.includes('footer') ? variants[7] :
    { tag: 'h1', text: 'CodeQuest', objective: 'Criar o título principal CodeQuest.', starter: '<main>\n  \n</main>', solution: '<main>\n  <h1>CodeQuest</h1>\n</main>', concept: 'HTML cria a estrutura da página com tags que descrevem cada parte do conteúdo.', hint: 'Use <h1>CodeQuest</h1> dentro do main.' }

  return {
    tech: 'html',
    badge: 'HTML',
    focus: `<${picked.tag}>`,
    objective: picked.objective,
    expectedText: picked.text,
    requiredTag: picked.tag,
    requiredAttrs: picked.attrs,
    files: [{ id: 'index.html', label: 'index.html', language: 'html', value: picked.starter }],
    solutionFiles: [{ id: 'index.html', label: 'index.html', language: 'html', value: picked.solution }],
    concept: picked.concept,
    useCase: 'HTML aparece em paginas, formularios, artigos, dashboards, componentes e qualquer interface web.',
    mentalModel: 'Pense em HTML como pecas de montar: abre a tag, coloca o conteudo, fecha a tag e o navegador renderiza.',
    hint: picked.hint,
    demoTitle: 'Preview renderizado',
    outputTitle: 'Preview em tempo real',
  }
}

function getCssSpec(lesson: Lesson, conceptSource?: string): ChallengeSpec {
  const source = normalize(conceptSource ?? `${lesson.title} ${lesson.description} ${JSON.stringify(lesson.content ?? '')}`)
  const variants = [
    {
      objective: 'Centralizar o card usando flexbox',
      requiredCss: ['display:flex', 'justify-content:center', 'align-items:center'],
      css: '.arena {\n  min-height: 220px;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}\n.card {\n  padding: 24px;\n  border-radius: 16px;\n  background: #7c3fff;\n  color: white;\n}',
      starter: '.arena {\n  min-height: 220px;\n}\n.card {\n  padding: 24px;\n  background: #7c3fff;\n  color: white;\n}',
      concept: 'Flexbox ajuda a alinhar elementos em uma direcao, como centro, linha ou coluna.',
      hint: 'Na classe .arena, adicione display:flex, justify-content:center e align-items:center.',
    },
    {
      objective: 'Criar uma grade com tres colunas',
      requiredCss: ['display:grid', 'grid-template-columns'],
      css: '.grid {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 12px;\n}\n.tile {\n  padding: 18px;\n  border-radius: 14px;\n  background: #1f2937;\n  color: #e0f2fe;\n}',
      starter: '.grid {\n  gap: 12px;\n}\n.tile {\n  padding: 18px;\n  background: #1f2937;\n  color: #e0f2fe;\n}',
      concept: 'CSS Grid cria layouts em linhas e colunas. Ele e perfeito para cards, galerias e dashboards.',
      hint: 'Use display:grid e grid-template-columns: repeat(3, 1fr).',
    },
    {
      objective: 'Adicionar uma animação suave ao botão',
      requiredCss: ['transition', ':hover', 'transform'],
      css: '.cta {\n  padding: 14px 20px;\n  border: 0;\n  border-radius: 999px;\n  background: #2ecc71;\n  color: #051b10;\n  font-weight: 900;\n  transition: transform .2s ease, box-shadow .2s ease;\n}\n.cta:hover {\n  transform: translateY(-3px);\n  box-shadow: 0 14px 35px rgba(46,204,113,.35);\n}',
      starter: '.cta {\n  padding: 14px 20px;\n  border: 0;\n  border-radius: 999px;\n  background: #2ecc71;\n  color: #051b10;\n  font-weight: 900;\n}',
      concept: 'Transições deixam mudanças visuais mais fluidas, como hover, foco e estados de botão.',
      hint: 'Adicione transition na .cta e crie .cta:hover com transform.',
    },
    {
      objective: 'Criar responsividade para telas pequenas',
      requiredCss: ['@media', 'grid-template-columns:1fr'],
      css: '.grid {\n  display: grid;\n  grid-template-columns: repeat(2, 1fr);\n  gap: 12px;\n}\n@media (max-width: 640px) {\n  .grid {\n    grid-template-columns: 1fr;\n  }\n}',
      starter: '.grid {\n  display: grid;\n  grid-template-columns: repeat(2, 1fr);\n  gap: 12px;\n}',
      concept: 'Responsividade adapta a interface para celulares, tablets e monitores sem quebrar o layout.',
      hint: 'Crie um @media (max-width: 640px) e mude a grid para uma coluna.',
    },
    {
      objective: 'Alterar a cor de fundo de um card usando background-color',
      requiredCss: ['background-color:#2ecc71'],
      css: '.card {\n  padding: 24px;\n  border-radius: 12px;\n  background-color: #2ecc71;\n  color: #06140d;\n}',
      starter: '.card {\n  padding: 24px;\n  border-radius: 12px;\n  color: #06140d;\n}',
      concept: 'Cores comunicam hierarquia, estado e identidade visual. background-color define o fundo de um elemento.',
      hint: 'Na classe .card, adicione background-color: #2ecc71.',
    },
    {
      objective: 'Criar tokens de cor usando variaveis CSS',
      requiredCss: [':root', '--color-primary', 'var(--color-primary)'],
      css: ':root {\n  --color-primary: #7c3fff;\n}\n.card {\n  padding: 24px;\n  background: var(--color-primary);\n  color: white;\n}',
      starter: '.card {\n  padding: 24px;\n  color: white;\n}',
      concept: 'Design tokens centralizam decisoes visuais como cor, espacamento e raio.',
      hint: 'Crie :root com --color-primary e use var(--color-primary) no card.',
    },
    {
      objective: 'Criar foco visivel para teclado usando :focus-visible',
      requiredCss: [':focus-visible', 'outline'],
      css: '.cta {\n  padding: 14px 20px;\n  border-radius: 10px;\n}\n.cta:focus-visible {\n  outline: 3px solid #4dbbff;\n  outline-offset: 3px;\n}',
      starter: '.cta {\n  padding: 14px 20px;\n  border-radius: 10px;\n}',
      concept: 'Foco visivel mostra onde a pessoa esta ao navegar pelo teclado.',
      hint: 'Crie .cta:focus-visible com outline e outline-offset.',
    },
    {
      objective: 'Adicionar margin para separar o card dos outros elementos',
      requiredCss: ['margin:24px'],
      css: '.card {\n  margin: 24px;\n  padding: 16px;\n  background: #ffffff;\n  color: #111827;\n}',
      starter: '.card {\n  padding: 16px;\n  background: #ffffff;\n  color: #111827;\n}',
      concept: 'Margin é o espaço externo do elemento. Ela afasta o card de outros elementos ao redor.',
      hint: 'Na classe .card, adicione margin: 24px.',
    },
    {
      objective: 'Adicionar padding para criar respiro interno no card',
      requiredCss: ['padding:24px'],
      css: '.card {\n  padding: 24px;\n  background: #7c3fff;\n  color: white;\n}',
      starter: '.card {\n  background: #7c3fff;\n  color: white;\n}',
      concept: 'Padding é o espaço interno do elemento. Ele afasta o conteúdo das bordas.',
      hint: 'Na classe .card, adicione padding: 24px.',
    },
  ]
  const picked =
    source.includes('margin') ? variants[7] :
    source.includes('padding') ? variants[8] :
    source.includes('cor') || source.includes('cores') || source.includes('background') ? variants[4] :
    source.includes('token') || source.includes('variave') || source.includes('tema') ? variants[5] :
    source.includes('focus') || source.includes('foco') || source.includes('acess') || source.includes('estado') ? variants[6] :
    source.includes('grid') || source.includes('coluna') ? variants[1] :
    source.includes('anim') || source.includes('transition') || source.includes('hover') || source.includes('transi') ? variants[2] :
    source.includes('responsiv') || source.includes('media') || source.includes('breakpoint') || source.includes('mobile') ? variants[3] :
    source.includes('flex') || source.includes('central') || source.includes('layout') ? variants[0] :
    variants[(Math.max(lesson.order_index, 1) - 1) % 4]
  const html = picked.objective.includes('foco')
    ? '<main><button class="cta">Entrar</button></main>'
    : picked.objective.includes('grade') || picked.objective.includes('responsividade')
      ? '<main class="grid"><div class="tile">HTML</div><div class="tile">CSS</div><div class="tile">JS</div></main>'
      : picked.objective.includes('Centralizar')
        ? '<main class="arena"><div class="card">Card centralizado</div></main>'
        : '<main><div class="card">Card visual</div></main>'

  return {
    tech: 'css',
    badge: 'CSS',
    focus: 'style.css',
    objective: picked.objective,
    requiredCss: picked.requiredCss,
    files: [
      { id: 'index.html', label: 'index.html', language: 'html', value: html },
      { id: 'style.css', label: 'style.css', language: 'css', value: picked.starter },
    ],
    solutionFiles: [
      { id: 'index.html', label: 'index.html', language: 'html', value: html },
      { id: 'style.css', label: 'style.css', language: 'css', value: picked.css },
    ],
    concept: picked.concept,
    useCase: 'CSS define visual, layout, espaco, responsividade, movimento e sensacao premium da interface.',
    mentalModel: 'HTML cria as pecas. CSS escolhe como essas pecas ficam na tela.',
    hint: picked.hint,
    demoTitle: 'Preview visual',
    outputTitle: 'Preview CSS em tempo real',
  }
}

function getJavaScriptSpec(lesson: Lesson, conceptSource?: string): ChallengeSpec {
  const source = normalize(conceptSource ?? `${lesson.title} ${lesson.description} ${JSON.stringify(lesson.content ?? '')}`)
  const variants = [
    {
      objective: 'Criar uma função somar que retorna 5',
      requiredJs: ['function somar', 'return', 'somar(2, 3)'],
      starter: 'function somar(a, b) {\n  \n}\n\nconsole.log(somar(2, 3))',
      solution: 'function somar(a, b) {\n  return a + b\n}\n\nconsole.log(somar(2, 3))',
      concept: 'Funções guardam uma ação reutilizável. Você envia valores e recebe um resultado.',
      hint: 'Dentro da função, retorne a + b.',
    },
    {
      objective: 'Usar array map para dobrar numeros',
      requiredJs: ['map', 'return', '[1, 2, 3]'],
      starter: 'const numeros = [1, 2, 3]\nconst dobrados = numeros\n\nconsole.log(dobrados)',
      solution: 'const numeros = [1, 2, 3]\nconst dobrados = numeros.map((numero) => numero * 2)\n\nconsole.log(dobrados)',
      concept: 'Arrays guardam listas. O map transforma cada item e devolve uma nova lista.',
      hint: 'Use numeros.map((numero) => numero * 2).',
    },
    {
      objective: 'Alterar o texto da página com DOM',
      requiredJs: ['querySelector', 'textContent', 'Missao iniciada'],
      starter: "const status = document.querySelector('#status')\n\n",
      solution: "const status = document.querySelector('#status')\nstatus.textContent = 'Missao iniciada'",
      concept: 'DOM é a representação da página que o JavaScript consegue ler e alterar.',
      hint: "Pegue #status e defina textContent como 'Missao iniciada'.",
    },
    {
      objective: 'Responder ao clique de um botão',
      requiredJs: ['addEventListener', 'click', 'textContent'],
      starter: "const botao = document.querySelector('#start')\nconst status = document.querySelector('#status')\n\n",
      solution: "const botao = document.querySelector('#start')\nconst status = document.querySelector('#status')\nbotao.addEventListener('click', () => {\n  status.textContent = 'Evento recebido'\n})",
      concept: 'Eventos avisam quando algo aconteceu: clique, digitar, enviar formulario ou mover o mouse.',
      hint: "Use botao.addEventListener('click', () => { ... }).",
    },
    {
      objective: 'Criar um objeto de usuário com nível',
      requiredJs: ['const usuario', 'nivel', 'console.log'],
      starter: 'const usuario = {\n  nome: "Ada"\n}\n\nconsole.log(usuario)',
      solution: 'const usuario = {\n  nome: "Ada",\n  nivel: 2\n}\n\nconsole.log(usuario.nivel)',
      concept: 'Objetos agrupam informacoes relacionadas usando chaves e valores.',
      hint: 'Adicione nivel: 2 dentro do objeto usuario.',
    },
    {
      objective: 'Criar uma Promise que resolve uma lista de tarefas',
      requiredJs: ['new promise', 'resolve', 'then'],
      starter: 'const carregarTarefas = new Promise((resolve) => {\n  \n})\n\ncarregarTarefas.then((tarefas) => console.log(tarefas))',
      solution: 'const carregarTarefas = new Promise((resolve) => {\n  resolve(["Estudar JS", "Praticar DOM"])\n})\n\ncarregarTarefas.then((tarefas) => console.log(tarefas))',
      concept: 'Promises representam operacoes que terminam no futuro, como buscar dados.',
      hint: 'Dentro da Promise, chame resolve com um array de tarefas.',
    },
    {
      objective: 'Salvar e recuperar uma preferencia com localStorage',
      requiredJs: ['localstorage.setitem', 'localstorage.getitem', 'tema'],
      starter: 'const tema = "dark"\n\nconsole.log("Tema salvo:", tema)',
      solution: 'const tema = "dark"\nlocalStorage.setItem("tema", tema)\n\nconsole.log("Tema salvo:", localStorage.getItem("tema"))',
      concept: 'localStorage persiste pequenas preferencias no navegador.',
      hint: 'Use localStorage.setItem("tema", tema) e depois localStorage.getItem("tema").',
    },
    {
      objective: 'Criar variáveis nome e nível com let e const',
      requiredJs: ['const nome', 'let nivel', 'console.log'],
      starter: 'const nome = "Ada"\n\nconsole.log(nome)',
      solution: 'const nome = "Ada"\nlet nivel = 1\n\nconsole.log(nome, nivel)',
      concept: 'Variáveis guardam valores. Use const quando o valor não muda e let quando ele pode mudar.',
      hint: 'Crie const nome e let nivel, depois mostre os dois no console.',
    },
    {
      objective: 'Criar valores string, number e boolean',
      requiredJs: ['string', 'number', 'boolean'],
      starter: 'const nome = "Ada"\n\nconsole.log(nome)',
      solution: 'const nome = "Ada" // string\nconst nivel = 2 // number\nconst ativo = true // boolean\n\nconsole.log(nome, nivel, ativo)',
      concept: 'Tipos primitivos descrevem o formato dos valores: texto, número e verdadeiro/falso.',
      hint: 'Crie um texto, um número e um booleano usando comentários ou nomes claros.',
    },
  ]
  const picked =
    source.includes('variavel') || source.includes('variáveis') || source.includes('const') || source.includes('let') ? variants[7] :
    source.includes('tipo') || source.includes('string') || source.includes('number') || source.includes('boolean') ? variants[8] :
    source.includes('promise') ? variants[5] :
    source.includes('async') || source.includes('await') ? { ...variants[5], objective: 'Usar async/await para carregar tarefas simuladas', requiredJs: ['async function', 'await', 'console.log'], starter: 'async function carregarTarefas() {\n  \n}\n\ncarregarTarefas()', solution: 'async function carregarTarefas() {\n  const tarefas = await Promise.resolve(["Estudar JS", "Praticar DOM"])\n  console.log(tarefas)\n}\n\ncarregarTarefas()', hint: 'Crie async function, use await Promise.resolve(...) e mostre no console.' } :
    source.includes('storage') || source.includes('persist') ? variants[6] :
    source.includes('array') || source.includes('map') || source.includes('lista') ? variants[1] :
    source.includes('dom') || source.includes('texto') ? variants[2] :
    source.includes('evento') || source.includes('clique') || source.includes('click') ? variants[3] :
    source.includes('objeto') || source.includes('nivel') ? variants[4] :
    source.includes('func') || source.includes('closure') || source.includes('escopo') ? variants[0] :
    variants[(Math.max(lesson.order_index, 1) - 1) % 5]
  return {
    tech: 'javascript',
    badge: 'JavaScript',
    focus: 'script.js',
    objective: picked.objective,
    requiredJs: picked.requiredJs,
    files: [
      { id: 'index.html', label: 'index.html', language: 'html', value: '<main>\n  <button id="start">Iniciar</button>\n  <p id="status">Aguardando acao</p>\n</main>' },
      { id: 'script.js', label: 'script.js', language: 'javascript', value: picked.starter },
    ],
    solutionFiles: [
      { id: 'index.html', label: 'index.html', language: 'html', value: '<main>\n  <button id="start">Iniciar</button>\n  <p id="status">Aguardando acao</p>\n</main>' },
      { id: 'script.js', label: 'script.js', language: 'javascript', value: picked.solution },
    ],
    concept: picked.concept,
    useCase: 'JavaScript da vida a interface: cliques, validacoes, dados, listas, animacoes e regras de negocio.',
    mentalModel: 'Pense em JavaScript como o motor que observa a tela, calcula respostas e muda o estado da experiencia.',
    hint: picked.hint,
    demoTitle: 'Demo executavel',
    outputTitle: 'Preview + console',
  }
}

function getReactSpec(lesson: Lesson, conceptSource?: string): ChallengeSpec {
  const source = normalize(conceptSource ?? `${lesson.title} ${lesson.description} ${JSON.stringify(lesson.content ?? '')}`)
  const variants = [
    {
      objective: 'Criar um componente Card com titulo',
      requiredJs: ['function Card', '<Card', 'props.titulo'],
      starter: 'function Card(props) {\n  return <article className="card"></article>\n}\n\nfunction App() {\n  return <Card titulo="Minha trilha" />\n}',
      solution: 'function Card(props) {\n  return <article className="card"><h1>{props.titulo}</h1></article>\n}\n\nfunction App() {\n  return <Card titulo="Minha trilha" />\n}',
      concept: 'Componentes React sao blocos reutilizaveis de interface.',
      hint: 'Mostre props.titulo dentro de um h1 no componente Card.',
    },
    {
      objective: 'Usar props para mostrar XP',
      requiredJs: ['props.xp', '<Badge', '120'],
      starter: 'function Badge(props) {\n  return <div className="badge"></div>\n}\n\nfunction App() {\n  return <Badge xp={120} />\n}',
      solution: 'function Badge(props) {\n  return <div className="badge">{props.xp} XP</div>\n}\n\nfunction App() {\n  return <Badge xp={120} />\n}',
      concept: 'Props sao dados enviados de um componente pai para um componente filho.',
      hint: 'Use {props.xp} dentro do JSX.',
    },
    {
      objective: 'Criar estado com useState',
      requiredJs: ['useState', 'setContador', 'contador'],
      starter: 'function App() {\n  const contador = 0\n  return <button>Cliques: {contador}</button>\n}',
      solution: 'function App() {\n  const [contador, setContador] = React.useState(0)\n  return <button onClick={() => setContador(contador + 1)}>Cliques: {contador}</button>\n}',
      concept: 'State guarda dados que mudam na tela, como contador, formulario, menu aberto ou progresso.',
      hint: 'Use React.useState(0) e atualize no onClick.',
    },
    {
      objective: 'Renderizar uma lista com map',
      requiredJs: ['map', 'key', 'HTML'],
      starter: 'function App() {\n  const trilhas = ["HTML", "CSS", "JS"]\n  return <ul></ul>\n}',
      solution: 'function App() {\n  const trilhas = ["HTML", "CSS", "JS"]\n  return <ul>{trilhas.map((trilha) => <li key={trilha}>{trilha}</li>)}</ul>\n}',
      concept: 'Listas em React costumam ser renderizadas com map.',
      hint: 'Dentro do ul, use trilhas.map e retorne um li com key.',
    },
    {
      objective: 'Usar useEffect para carregar dados ao montar',
      requiredJs: ['useEffect', 'setItens', 'React.useState'],
      starter: 'function App() {\n  const [itens, setItens] = React.useState([])\n\n  return <p>{itens.length} itens</p>\n}',
      solution: 'function App() {\n  const [itens, setItens] = React.useState([])\n  React.useEffect(() => {\n    setItens(["HTML", "CSS", "React"])\n  }, [])\n\n  return <p>{itens.length} itens</p>\n}',
      concept: 'useEffect sincroniza o componente com dados, APIs e efeitos externos.',
      hint: 'Use React.useEffect com array vazio e chame setItens dentro dele.',
    },
    {
      objective: 'Criar um formulario controlado com useState',
      requiredJs: ['useState', 'value', 'onChange'],
      starter: 'function App() {\n  return <input placeholder="Nome" />\n}',
      solution: 'function App() {\n  const [nome, setNome] = React.useState("")\n  return <input value={nome} onChange={(event) => setNome(event.target.value)} placeholder="Nome" />\n}',
      concept: 'Formularios controlados deixam o React guardar o valor atual dos inputs.',
      hint: 'Crie um state nome e conecte value e onChange no input.',
    },
  ]
  const picked =
    source.includes('effect') || source.includes('efeito') || source.includes('dados') ? variants[4] :
    source.includes('form') || source.includes('input') ? variants[5] :
    source.includes('props') ? variants[1] :
    source.includes('estado') || source.includes('state') || source.includes('usestate') ? variants[2] :
    source.includes('lista') || source.includes('map') || source.includes('key') ? variants[3] :
    source.includes('componente') || source.includes('component') || source.includes('compos') ? variants[0] :
    variants[(Math.max(lesson.order_index, 1) - 1) % 4]
  const css = '.card,.badge,button,li{padding:14px 18px;border-radius:14px;background:#7c3fff;color:white;font-weight:800;margin:8px}body{font-family:Inter,Arial;background:#090916;color:white}'
  return {
    tech: 'react',
    badge: 'React',
    focus: 'App.jsx',
    objective: picked.objective,
    requiredJs: picked.requiredJs,
    files: [
      { id: 'App.jsx', label: 'App.jsx', language: 'javascript', value: picked.starter },
      { id: 'style.css', label: 'style.css', language: 'css', value: css },
    ],
    solutionFiles: [
      { id: 'App.jsx', label: 'App.jsx', language: 'javascript', value: picked.solution },
      { id: 'style.css', label: 'style.css', language: 'css', value: css },
    ],
    concept: picked.concept,
    useCase: 'React e usado para dashboards, plataformas SaaS, apps de aprendizado, lojas e produtos interativos.',
    mentalModel: 'Você descreve componentes. Quando os dados mudam, o React redesenha a parte necessária da tela.',
    hint: picked.hint,
    demoTitle: 'Preview React',
    outputTitle: 'Preview JSX em tempo real',
  }
}

function getTypeScriptSpec(lesson: Lesson, conceptSource?: string): ChallengeSpec {
  const source = normalize(conceptSource ?? `${lesson.title} ${lesson.description} ${JSON.stringify(lesson.content ?? '')}`)
  const variants = [
    {
      objective: 'Tipar um perfil de usuário',
      requiredJs: ['type Perfil', 'nome: string', 'nivel: number'],
      starter: 'const perfil = {\n  nome: "Ada",\n  nivel: 3\n}\n\nconsole.log(perfil.nome)',
      solution: 'type Perfil = {\n  nome: string\n  nivel: number\n}\n\nconst perfil: Perfil = {\n  nome: "Ada",\n  nivel: 3\n}\n\nconsole.log(perfil.nome)',
      concept: 'TypeScript adiciona tipos ao JavaScript para pegar erros antes do código rodar.',
      hint: 'Crie type Perfil com nome:string e nivel:number, depois use const perfil: Perfil.',
    },
    {
      objective: 'Criar uma interface de Missão',
      requiredJs: ['interface Missao', 'xp: number', 'concluida: boolean'],
      starter: 'const missao = {\n  titulo: "HTML basico",\n  xp: 80,\n  concluida: false\n}',
      solution: 'interface Missao {\n  titulo: string\n  xp: number\n  concluida: boolean\n}\n\nconst missao: Missao = {\n  titulo: "HTML basico",\n  xp: 80,\n  concluida: false\n}',
      concept: 'Interfaces descrevem o formato de objetos usados na aplicacao.',
      hint: 'Defina interface Missao com titulo, xp e concluida.',
    },
    {
      objective: 'Tipar uma função que soma XP',
      requiredJs: ['function somarXp', 'number', 'return'],
      starter: 'function somarXp(atual, ganho) {\n  return atual + ganho\n}',
      solution: 'function somarXp(atual: number, ganho: number): number {\n  return atual + ganho\n}',
      concept: 'Tipos em parametros e retorno deixam funcoes mais previsiveis.',
      hint: 'Adicione : number nos parâmetros e no retorno da função.',
    },
    {
      objective: 'Criar uma função genérica first<T>',
      requiredJs: ['function first<t>', 'items: t[]', 'return items[0]'],
      starter: 'function first(items) {\n  return items[0]\n}\n\nconst primeira = first(["HTML", "CSS"])',
      solution: 'function first<T>(items: T[]): T {\n  return items[0]\n}\n\nconst primeira = first(["HTML", "CSS"])',
      concept: 'Generics preservam o tipo de entrada ao reutilizar uma função.',
      hint: 'Use function first<T>(items: T[]): T.',
    },
    {
      objective: 'Modelar status com union type',
      requiredJs: ['type status', '"locked"', '"completed"'],
      starter: 'const status = "completed"',
      solution: 'type Status = "locked" | "available" | "completed"\n\nconst status: Status = "completed"',
      concept: 'Union types limitam valores possiveis e evitam estados impossiveis.',
      hint: 'Crie type Status com os valores permitidos.',
    },
  ]
  const picked =
    source.includes('generic') || source.includes('generics') ? variants[3] :
    source.includes('union') || source.includes('narrow') || source.includes('status') ? variants[4] :
    source.includes('interface') || source.includes('objeto') ? variants[1] :
    source.includes('func') || source.includes('retorno') || source.includes('param') ? variants[2] :
    variants[0]
  return {
    tech: 'typescript',
    badge: 'TypeScript',
    focus: 'main.ts',
    objective: picked.objective,
    requiredJs: picked.requiredJs,
    files: [{ id: 'main.ts', label: 'main.ts', language: 'typescript', value: picked.starter }],
    solutionFiles: [{ id: 'main.ts', label: 'main.ts', language: 'typescript', value: picked.solution }],
    concept: picked.concept,
    useCase: 'TypeScript e comum em apps React, APIs Node, SDKs, dashboards e produtos grandes.',
    mentalModel: 'Você ainda escreve JavaScript, mas adiciona contratos que avisam quando os dados não combinam.',
    hint: picked.hint,
    demoTitle: 'Saida esperada',
    outputTitle: 'Type-check simulado',
  }
}

function getNodeSpec(lesson: Lesson, conceptSource?: string): ChallengeSpec {
  const source = normalize(conceptSource ?? `${lesson.title} ${lesson.description} ${JSON.stringify(lesson.content ?? '')}`)
  if (source.includes('middleware')) {
    return {
      tech: 'node',
      badge: 'Node/API',
      focus: 'server.js',
      objective: 'Criar um middleware de log que chama next()',
      requiredJs: ['app.use', 'console.log', 'next()'],
      files: [{ id: 'server.js', label: 'server.js', language: 'javascript', value: 'const app = createApi()\n\n' }],
      solutionFiles: [{ id: 'server.js', label: 'server.js', language: 'javascript', value: "const app = createApi()\n\napp.use((req, res, next) => {\n  console.log(req.method)\n  next()\n})" }],
      concept: 'Middlewares passam pela request antes da rota final e organizam logs, auth e validacao.',
      useCase: 'Backends usam middlewares para seguranca, metricas, autenticacao e tratamento de erros.',
      mentalModel: 'A request entra em uma esteira: cada middleware faz uma parte e chama next().',
      hint: 'Use app.use((req, res, next) => { console.log(req.method); next() }).',
      demoTitle: 'Request simulado',
      outputTitle: 'Log do servidor',
    }
  }
  if (source.includes('json') || source.includes('crud') || source.includes('post') || source.includes('patch')) {
    return {
      tech: 'node',
      badge: 'Node/API',
      focus: 'server.js',
      objective: 'Criar uma rota POST /tarefas que responde JSON',
      requiredJs: ['app.post', '/tarefas', 'res.json'],
      files: [{ id: 'server.js', label: 'server.js', language: 'javascript', value: "const app = createApi()\n\napp.post('/tarefas', (req, res) => {\n  \n})" }],
      solutionFiles: [{ id: 'server.js', label: 'server.js', language: 'javascript', value: "const app = createApi()\n\napp.post('/tarefas', (req, res) => {\n  res.json({ created: true })\n})" }],
      concept: 'Rotas POST recebem dados e devolvem uma resposta estruturada em JSON.',
      useCase: 'APIs criam tarefas, perfis, progresso e configurações usando endpoints.',
      mentalModel: 'O cliente envia uma acao, o backend valida e responde um objeto JSON.',
      hint: 'Dentro de app.post, use res.json({ created: true }).',
      demoTitle: 'POST simulado',
      outputTitle: 'Response JSON',
    }
  }
  return {
    tech: 'node',
    badge: 'Node/API',
    focus: 'server.js',
    objective: 'Criar uma rota GET /status que responde JSON',
    requiredJs: ['app.get', '/status', 'res.json', 'ok'],
    files: [{
      id: 'server.js',
      label: 'server.js',
      language: 'javascript',
      value: "const app = createApi()\n\napp.get('/status', (req, res) => {\n  \n})",
    }],
    solutionFiles: [{
      id: 'server.js',
      label: 'server.js',
      language: 'javascript',
      value: "const app = createApi()\n\napp.get('/status', (req, res) => {\n  res.json({ ok: true, service: 'DevTags API' })\n})",
    }],
    concept: 'APIs recebem requests e devolvem responses. Uma rota GET normalmente busca ou mostra informacoes.',
    useCase: 'Backends entregam dados para dashboards, autenticacao, progresso, ranking, pagamentos e perfis.',
    mentalModel: 'Imagine uma porta: o front chama /status, o servidor processa e devolve JSON.',
    hint: "Dentro da rota, use res.json({ ok: true, service: 'DevTags API' }).",
    demoTitle: 'Request simulado',
    outputTitle: 'Response JSON',
  }
}

function getSqlSpec(lesson: Lesson, conceptSource?: string): ChallengeSpec {
  const source = normalize(conceptSource ?? `${lesson.title} ${lesson.description} ${JSON.stringify(lesson.content ?? '')}`)
  const variants = [
    {
      objective: 'Consultar usuarios ativos',
      requiredJs: ['select', 'from usuarios', 'where ativo = true'],
      starter: 'select *\nfrom usuarios;',
      solution: 'select id, nome, nivel\nfrom usuarios\nwhere ativo = true;',
      concept: 'SQL consulta dados em tabelas usando comandos como select, from e where.',
      hint: 'Use where ativo = true para filtrar apenas usuarios ativos.',
    },
    {
      objective: 'Criar uma tabela de progresso',
      requiredJs: ['create table', 'progresso', 'user_id'],
      starter: 'create table progresso (\n  id uuid primary key\n);',
      solution: 'create table progresso (\n  id uuid primary key,\n  user_id uuid not null,\n  xp_total int default 0\n);',
      concept: 'Tabelas guardam registros. Cada coluna descreve uma informacao daquele registro.',
      hint: 'Adicione user_id uuid not null e xp_total int default 0.',
    },
    {
      objective: 'Inserir uma trilha favorita',
      requiredJs: ['insert into', 'trilhas', 'values'],
      starter: "insert into trilhas (slug, titulo)\n",
      solution: "insert into trilhas (slug, titulo)\nvalues ('html', 'HTML');",
      concept: 'Insert cria novos registros em uma tabela.',
      hint: 'Complete com values para informar os dados da nova linha.',
    },
  ]
  const picked =
    source.includes('insert') || source.includes('update') || source.includes('escrita') ? variants[2] :
    source.includes('join') || source.includes('relacion') ? { ...variants[0], objective: 'Consultar usuários com progresso usando JOIN', requiredJs: ['select', 'join', 'on'], starter: 'select usuarios.nome\nfrom usuarios\n', solution: 'select usuarios.nome, progresso.xp_total\nfrom usuarios\njoin progresso on progresso.user_id = usuarios.id;', concept: 'JOIN combina dados de tabelas relacionadas.', hint: 'Use join progresso on progresso.user_id = usuarios.id.' } :
    variants[0]
  return {
    tech: 'sql',
    badge: 'SQL',
    focus: 'query.sql',
    objective: picked.objective,
    requiredJs: picked.requiredJs,
    files: [{ id: 'query.sql', label: 'query.sql', language: 'sql', value: picked.starter }],
    solutionFiles: [{ id: 'query.sql', label: 'query.sql', language: 'sql', value: picked.solution }],
    concept: picked.concept,
    useCase: 'SQL aparece em Supabase, Postgres, dashboards, rankings, perfis e sistemas de progresso.',
    mentalModel: 'Pense em tabelas como planilhas poderosas: você consulta, filtra, cria e relaciona dados.',
    hint: picked.hint,
    demoTitle: 'Resultado esperado',
    outputTitle: 'Resultado SQL',
  }
}

function getGitSpec(lesson: Lesson, conceptSource?: string): ChallengeSpec {
  const source = normalize(conceptSource ?? `${lesson.title} ${lesson.description} ${JSON.stringify(lesson.content ?? '')}`)
  if (source.includes('branch')) {
    return {
      tech: 'git',
      badge: 'Git/GitHub',
      focus: 'terminal',
      objective: 'Criar uma branch de trabalho chamada feature/aula',
      requiredJs: ['git checkout -b', 'feature/aula'],
      files: [{ id: 'terminal.sh', label: 'terminal.sh', language: 'shell', value: 'git status\n\n' }],
      solutionFiles: [{ id: 'terminal.sh', label: 'terminal.sh', language: 'shell', value: 'git status\ngit checkout -b feature/aula' }],
      concept: 'Branches isolam mudanças para você trabalhar sem mexer direto na linha principal.',
      useCase: 'Times usam branches para organizar tarefas, revisões e entregas.',
      mentalModel: 'Uma branch é uma linha paralela de trabalho.',
      hint: 'Use git checkout -b feature/aula.',
      demoTitle: 'Fluxo esperado',
      outputTitle: 'Terminal Git',
    }
  }
  return {
    tech: 'git',
    badge: 'Git/GitHub',
    focus: 'terminal',
    objective: 'Criar um commit com uma mensagem clara',
    requiredJs: ['git add .', 'git commit -m', 'primeira missao'],
    files: [{
      id: 'terminal.sh',
      label: 'terminal.sh',
      language: 'shell',
      value: 'git status\n\n',
    }],
    solutionFiles: [{
      id: 'terminal.sh',
      label: 'terminal.sh',
      language: 'shell',
      value: 'git status\ngit add .\ngit commit -m "primeira missao"',
    }],
    concept: 'Git salva pontos da historia do projeto. Cada commit deve representar uma mudanca clara.',
    useCase: 'Git é usado em trabalho real para revisar código, voltar versões, colaborar e publicar projetos.',
    mentalModel: 'git add prepara arquivos. git commit salva esse pacote com uma mensagem.',
    hint: 'Depois de git status, rode git add . e git commit -m "primeira missao".',
    demoTitle: 'Fluxo esperado',
    outputTitle: 'Terminal Git',
  }
}

function getPythonSpec(lesson: Lesson, conceptSource?: string): ChallengeSpec {
  const source = normalize(conceptSource ?? `${lesson.title} ${lesson.description} ${JSON.stringify(lesson.content ?? '')}`)
  const picked = source.includes('lista') || source.includes('for')
    ? {
      objective: 'Percorrer uma lista e imprimir cada linguagem',
      requiredJs: ['for', 'in', 'print'],
      starter: 'linguagens = ["HTML", "CSS", "JS"]\n\n',
      solution: 'linguagens = ["HTML", "CSS", "JS"]\n\nfor linguagem in linguagens:\n    print(linguagem)',
      concept: 'Loops repetem uma acao para cada item de uma lista.',
      hint: 'Use for linguagem in linguagens: e depois print(linguagem).',
    }
    : source.includes('if') || source.includes('condicion')
    ? {
        objective: 'Criar uma condicional que aprova XP suficiente',
        requiredJs: ['if', '>=', 'print'],
        starter: 'xp = 120\n\n',
        solution: 'xp = 120\n\nif xp >= 100:\n    print("Aprovado")',
        concept: 'Condicionais escolhem caminhos diferentes conforme uma regra.',
        hint: 'Use if xp >= 100: e imprima Aprovado.',
      }
    : {
      objective: 'Criar uma função dobro que retorna 8',
      requiredJs: ['def dobro', 'return', 'dobro(4)'],
      starter: 'def dobro(numero):\n    \n\nprint(dobro(4))',
      solution: 'def dobro(numero):\n    return numero * 2\n\nprint(dobro(4))',
      concept: 'Funções Python organizam uma regra para você reutilizar com valores diferentes.',
      hint: 'Dentro da função, use return numero * 2.',
    }
  return {
    tech: 'python',
    badge: 'Python',
    focus: 'main.py',
    objective: picked.objective,
    requiredJs: picked.requiredJs,
    files: [{ id: 'main.py', label: 'main.py', language: 'python', value: picked.starter }],
    solutionFiles: [{ id: 'main.py', label: 'main.py', language: 'python', value: picked.solution }],
    concept: picked.concept,
    useCase: 'Python e usado em automacao, dados, scripts, APIs, IA e desafios logicos.',
    mentalModel: 'Escreva instrucoes de cima para baixo, rode o programa e leia o resultado no terminal.',
    hint: picked.hint,
    demoTitle: 'Terminal esperado',
    outputTitle: 'Terminal Python',
  }
}

function getLessonConceptSources(lesson: Lesson, track?: Track | null) {
  const source = normalize(`${lesson.title} ${lesson.description} ${JSON.stringify(lesson.content ?? '')}`)
  const tech = detectTech(lesson, track)
  const concepts: string[] = []
  const add = (label: string, patterns: string[]) => {
    if (patterns.some((pattern) => source.includes(pattern))) concepts.push(label)
  }

  if (tech === 'html') {
    add('heading h1 titulo principal', ['heading', 'h1', 'h1-h6', 'titulo', 'título'])
    add('paragrafo tag p texto', ['paragra', ' tag p', '<p'])
    add('link href ancora', ['link', 'href'])
    add('imagem img src alt', ['imagem', 'img', 'alt', 'midia', 'media'])
    add('lista li ul', ['lista', '<li'])
    add('formulario label input', ['form', 'input', 'label'])
    add('tabela caption thead tbody', ['tabela', 'table', 'dados'])
  } else if (tech === 'css') {
    add('margin espacamento externo', ['margin'])
    add('padding espacamento interno', ['padding'])
    add('flexbox alinhamento', ['flex', 'flexbox'])
    add('grid colunas layout', ['grid'])
    add('cores background-color', ['cor', 'cores', 'background'])
    add('variaveis tokens tema', ['variave', 'token', 'tema'])
    add('focus-visible acessibilidade', ['focus', 'foco', 'acess'])
  } else if (tech === 'javascript') {
    add('variaveis const let', ['variavel', 'variáveis', 'let', 'const'])
    add('tipos valores primitivos', ['tipo', 'string', 'number', 'boolean'])
    add('funcoes return mensagem', ['func', 'function'])
    add('arrays map listas', ['array', 'map', 'lista'])
    add('objetos propriedades', ['objeto', 'object'])
    add('dom textcontent queryselector', ['dom'])
    add('eventos click addEventListener', ['evento', 'click', 'clique'])
    add('promise assincrono', ['promise'])
    add('async await assincrono', ['async', 'await'])
    add('localstorage persistencia', ['storage', 'persist'])
  } else if (tech === 'react') {
    add('componentes function Card', ['componente', 'component', 'compos'])
    add('props dados', ['props'])
    add('state useState estado', ['state', 'estado', 'usestate'])
    add('listas map key', ['lista', 'map', 'key'])
    add('useEffect dados', ['effect', 'efeito'])
    add('formulario controlado input', ['form', 'input'])
  } else if (tech === 'typescript') {
    add('interfaces objetos', ['interface', 'objeto'])
    add('funcoes tipadas parametros retorno', ['func', 'param', 'retorno'])
    add('union status narrowing', ['union', 'status', 'narrow'])
    add('generics first T', ['generic'])
  } else if (tech === 'node') {
    add('rotas get status json', ['rota', 'endpoint', 'get'])
    add('json post crud', ['json', 'post', 'crud', 'patch'])
    add('middleware next log', ['middleware'])
  } else if (tech === 'sql') {
    add('select where consulta', ['select', 'consulta', 'filtro'])
    add('insert update escrita', ['insert', 'update', 'escrita'])
    add('join relacionamentos', ['join', 'relacion'])
  } else if (tech === 'git') {
    add('branch checkout', ['branch'])
    add('commit add mensagem', ['commit'])
    add('pull request pr', ['pull request', 'pr'])
  } else if (tech === 'python') {
    add('funcoes def return', ['func'])
    add('listas for loop', ['lista', 'for'])
    add('condicionais if', ['if', 'condicion'])
  }

  return Array.from(new Set(concepts)).slice(0, 3)
}

function getChallengeSpecForConcept(lesson: Lesson, track: Track | null | undefined, conceptSource?: string): ChallengeSpec {
  const tech = detectTech(lesson, track)
  if (tech === 'css') return getCssSpec(lesson, conceptSource)
  if (tech === 'javascript') return getJavaScriptSpec(lesson, conceptSource)
  if (tech === 'typescript') return getTypeScriptSpec(lesson, conceptSource)
  if (tech === 'react') return getReactSpec(lesson, conceptSource)
  if (tech === 'node') return getNodeSpec(lesson, conceptSource)
  if (tech === 'python') return getPythonSpec(lesson, conceptSource)
  if (tech === 'sql') return getSqlSpec(lesson, conceptSource)
  if (tech === 'git') return getGitSpec(lesson, conceptSource)
  return getHtmlSpec(lesson, conceptSource)
}

function getChallengeSpecs(lesson: Lesson, track?: Track | null): ChallengeSpec[] {
  const concepts = getLessonConceptSources(lesson, track)
  if (!concepts.length) return [getChallengeSpecForConcept(lesson, track)]

  return concepts.map((concept) => getChallengeSpecForConcept(lesson, track, concept))
}

function validateMission(files: MissionFile[], spec: ChallengeSpec): ValidationResult {
  if (spec.tech === 'html') return validateHtml(fileById(files, 'index.html'), spec)
  if (spec.tech === 'css') return validateCss(fileById(files, 'style.css'), spec)
  if (spec.tech === 'javascript') return validateJavaScript(fileById(files, 'script.js'), spec)
  if (spec.tech === 'typescript') return validateKeywordMission(fileById(files, 'main.ts'), spec, 'TypeScript validado', 'O contrato de tipos esperado foi encontrado.')
  if (spec.tech === 'react') return validateReact(fileById(files, 'App.jsx'), spec)
  if (spec.tech === 'node') return validateNode(fileById(files, 'server.js'), spec)
  if (spec.tech === 'sql') return validateKeywordMission(fileById(files, 'query.sql'), spec, 'SQL validado', 'A consulta contém as cláusulas principais da missão.')
  if (spec.tech === 'git') return validateKeywordMission(fileById(files, 'terminal.sh'), spec, 'Git validado', 'O fluxo de terminal contém os comandos esperados.')
  return validatePython(fileById(files, 'main.py'), spec)
}

function validateHtml(code: string, spec: ChallengeSpec): ValidationResult {
  const tag = spec.requiredTag ?? 'main'
  const openTag = new RegExp(`<${tag}(\\s|>|$)`, 'i')
  const closeTag = new RegExp(`</${tag}>`, 'i')
  const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'])
  if (!openTag.test(code)) return { ok: false, kind: 'error', title: 'Quase lá', detail: `Ainda não encontrei a tag <${tag}>.` }
  if (!voidTags.has(tag) && !closeTag.test(code)) return { ok: false, kind: 'warn', title: 'Você está muito perto', detail: `Você abriu <${tag}>, mas faltou fechar com </${tag}>.` }
  const doc = new DOMParser().parseFromString(code, 'text/html')
  const element = doc.querySelector(tag)
  if (!element) return { ok: false, kind: 'error', title: 'Ajuste pequeno', detail: `A tag <${tag}> parece escrita de um jeito que o navegador não entendeu.` }
  const missingAttr = (spec.requiredAttrs ?? []).find((attr) => !element.getAttribute(attr)?.trim())
  if (missingAttr) return { ok: false, kind: 'warn', title: 'Atributo obrigatorio', detail: `Inclua o atributo ${missingAttr} em <${tag}>.` }
  if (!voidTags.has(tag) && !element.textContent?.trim()) return { ok: false, kind: 'warn', title: 'Boa estrutura', detail: `Agora coloque texto dentro de <${tag}>.` }
  if (spec.expectedText && !element.textContent.includes(spec.expectedText)) return { ok: false, kind: 'warn', title: 'Texto quase certo', detail: `O texto esperado e "${spec.expectedText}".` }
  return { ok: true, kind: 'success', title: 'Missão validada', detail: 'Tag, fechamento e conteúdo estão corretos.' }
}

function validateCss(css: string, spec: ChallengeSpec): ValidationResult {
  const clean = normalize(css).replace(/\s*:\s*/g, ':').replace(/\s*,\s*/g, ',')
  const missing = (spec.requiredCss ?? []).find((item) => !clean.includes(item.toLowerCase()))
  if (missing) return { ok: false, kind: 'warn', title: 'CSS quase pronto', detail: `Ainda falta usar "${missing}" para cumprir o objetivo visual.` }
  if (!/[.{#][\w-]+\s*\{/.test(css)) return { ok: false, kind: 'error', title: 'Seletor ausente', detail: 'Crie uma regra CSS com seletor e chaves, por exemplo .card { ... }.' }
  return { ok: true, kind: 'success', title: 'Estilo validado', detail: 'As propriedades principais estão presentes e o preview já reflete sua solução.' }
}

function validateJavaScript(js: string, spec: ChallengeSpec): ValidationResult {
  const clean = normalize(js)
  const missing = (spec.requiredJs ?? []).find((item) => !clean.includes(normalize(item)))
  if (missing) return { ok: false, kind: 'warn', title: 'Lógica incompleta', detail: `Procure incluir "${missing}" na sua solução.` }
  try {
    new Function(js)
  } catch (error: any) {
    return { ok: false, kind: 'error', title: 'Erro de sintaxe', detail: error?.message ?? 'O JavaScript ainda não consegue ser executado.' }
  }
  return { ok: true, kind: 'success', title: 'JavaScript validado', detail: 'A lógica esperada existe e o código não tem erro de sintaxe.' }
}

function validateReact(code: string, spec: ChallengeSpec): ValidationResult {
  const clean = normalize(code)
  const missing = (spec.requiredJs ?? []).find((item) => !clean.includes(normalize(item)))
  if (missing) return { ok: false, kind: 'warn', title: 'Componente incompleto', detail: `Ainda falta usar "${missing}" no componente.` }
  if (!code.includes('function App')) return { ok: false, kind: 'error', title: 'App ausente', detail: 'Mantenha um componente function App para renderizar o preview.' }
  if (!code.includes('return')) return { ok: false, kind: 'warn', title: 'Sem JSX retornado', detail: 'Um componente precisa retornar JSX para aparecer na tela.' }
  return { ok: true, kind: 'success', title: 'React validado', detail: 'Componente, JSX e requisito principal estao presentes.' }
}

function validateNode(code: string, spec: ChallengeSpec): ValidationResult {
  const clean = normalize(code)
  const missing = (spec.requiredJs ?? []).find((item) => !clean.includes(normalize(item)))
  if (missing) return { ok: false, kind: 'warn', title: 'Rota incompleta', detail: `A API ainda precisa de "${missing}".` }
  return { ok: true, kind: 'success', title: 'API validada', detail: 'A rota e a resposta JSON esperada foram encontradas.' }
}

function validatePython(code: string, spec: ChallengeSpec): ValidationResult {
  const clean = normalize(code)
  const missing = (spec.requiredJs ?? []).find((item) => !clean.includes(normalize(item)))
  if (missing) return { ok: false, kind: 'warn', title: 'Python incompleto', detail: `Inclua "${missing}" para resolver a missão.` }
  if (/def\s+\w+\([^)]*\):\s*$/m.test(code) && !/\n\s+(return|print|for|if)/.test(code)) {
    return { ok: false, kind: 'warn', title: 'Bloco vazio', detail: 'Depois dos dois pontos, Python precisa de uma linha indentada.' }
  }
  return { ok: true, kind: 'success', title: 'Python validado', detail: 'A estrutura esperada está presente para esta missão.' }
}

function validateKeywordMission(code: string, spec: ChallengeSpec, title: string, detail: string): ValidationResult {
  const clean = normalize(code)
  const missing = (spec.requiredJs ?? []).find((item) => !clean.includes(normalize(item)))
  if (missing) return { ok: false, kind: 'warn', title: 'Falta um detalhe', detail: `Inclua "${missing}" para cumprir o objetivo.` }
  return { ok: true, kind: 'success', title, detail }
}

function toFileState(files: MissionFile[]) {
  return Object.fromEntries(files.map((file) => [file.id, file.value])) as Record<string, string>
}

function filesFromState(spec: ChallengeSpec, values: Record<string, string>): MissionFile[] {
  return spec.files.map((file) => ({ ...file, value: values[file.id] ?? '' }))
}

function getLessonDifficulty(blocks: any[]) {
  const difficulty = blocks.find((block) => block?.difficulty)?.difficulty
  if (!difficulty) return 'pratica'
  return String(difficulty)
}

function buildHtmlPreview(files: MissionFile[]) {
  const html = fileById(files, 'index.html')
  const css = fileById(files, 'style.css')
  const js = fileById(files, 'script.js')
  return `<!doctype html><html><head><style>body{font-family:Inter,Arial,sans-serif;margin:0;padding:24px;color:#111827;background:#fff}button{cursor:pointer}${css}</style></head><body>${html}<script>${js}<\/script></body></html>`
}

function buildReactPreview(files: MissionFile[]) {
  const app = fileById(files, 'App.jsx')
  const css = fileById(files, 'style.css')
  return `<!doctype html><html><head><style>${css}</style><script src="https://unpkg.com/react@18/umd/react.development.js"><\/script><script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script><script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script></head><body><div id="root"></div><script type="text/babel">${app}\nReactDOM.createRoot(document.getElementById('root')).render(<App />)<\/script></body></html>`
}

function buildJavaScriptPreview(files: MissionFile[]) {
  const html = fileById(files, 'index.html')
  const js = fileById(files, 'script.js')
  return `<!doctype html><html><head><style>body{font-family:Inter,Arial,sans-serif;margin:0;padding:24px;color:#111827;background:#fff}button{padding:12px 16px;border:0;border-radius:12px;background:#7c3fff;color:white;font-weight:800}</style></head><body>${html}<script>const send=(type,args)=>parent.postMessage({source:'codequest-js-console',type,args:Array.from(args).map((item)=>typeof item==='object'?JSON.stringify(item):String(item))},'*');console.log=(...args)=>send('log',args);console.error=(...args)=>send('error',args);try{${js}}catch(error){console.error(error.message)}<\/script></body></html>`
}

function getOutput(spec: ChallengeSpec, files: MissionFile[], runtimeLines: string[]) {
  if (spec.tech === 'javascript') return runtimeLines.length ? runtimeLines : ['Console pronto. Rode seu código e veja logs aqui.']
  if (spec.tech === 'node') {
    const ok = validateNode(fileById(files, 'server.js'), spec).ok
    return ok
      ? ['GET /status', 'HTTP 200', '{ "ok": true, "service": "DevTags API" }']
      : ['GET /status', 'HTTP 404', '{ "error": "Rota ainda não respondeu JSON" }']
  }
  if (spec.tech === 'python') {
    const code = fileById(files, 'main.py')
    if (code.includes('dobro') && code.includes('return')) return ['$ python main.py', '8']
    if (code.includes('for') && code.includes('print')) return ['$ python main.py', 'HTML', 'CSS', 'JS']
    return ['$ python main.py', 'Aguardando uma solução válida...']
  }
  if (spec.tech === 'typescript') {
    const ok = validateKeywordMission(fileById(files, 'main.ts'), spec, 'ok', 'ok').ok
    return ok ? ['$ tsc --noEmit', 'Sem erros de tipo para esta missão.'] : ['$ tsc --noEmit', 'Aguardando tipos obrigatórios...']
  }
  if (spec.tech === 'sql') {
    const ok = validateKeywordMission(fileById(files, 'query.sql'), spec, 'ok', 'ok').ok
    return ok ? ['Query executada', 'Linhas afetadas/retornadas: 1'] : ['Query ainda incompleta', 'Complete as cláusulas obrigatórias.']
  }
  if (spec.tech === 'git') {
    const ok = validateKeywordMission(fileById(files, 'terminal.sh'), spec, 'ok', 'ok').ok
    return ok ? ['$ git status', 'working tree clean', '[main abc123] primeira missao'] : ['$ git status', 'Arquivos modificados aguardando add/commit.']
  }
  if (spec.tech === 'react') return ['Preview React renderizando no painel acima.', 'Se o JSX falhar, confira return, props, state e tags fechadas.']
  return ['Preview visual atualizado em tempo real.']
}

export function GameMissionExperience({ lesson, track }: { lesson: Lesson; track?: Track | null }) {
  const router = useRouter()
  const { profile, updateProfile } = useAppStore()
  const specs = useMemo(() => getChallengeSpecs(lesson, track), [lesson, track])
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const spec = specs[Math.min(activeStepIndex, specs.length - 1)]
  const blocks = useMemo(() => (Array.isArray(lesson.content) ? lesson.content : []), [lesson.content])
  const difficulty = useMemo(() => getLessonDifficulty(blocks), [blocks])
  const [stage, setStage] = useState<MissionStage>('briefing')
  const [activeFileId, setActiveFileId] = useState(getInitialFileId(spec))
  const [fileValues, setFileValues] = useState<Record<string, string>>(() => toFileState(spec.files))
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [victory, setVictory] = useState(false)
  const [saving, setSaving] = useState(false)
  const [runtimeLines, setRuntimeLines] = useState<string[]>([])

  const files = useMemo(() => filesFromState(spec, fileValues), [spec, fileValues])
  const activeFile = files.find((file) => file.id === activeFileId) ?? files[0]
  const previewDoc = useMemo(() => {
    if (spec.tech === 'react') return buildReactPreview(files)
    if (spec.tech === 'javascript') return buildJavaScriptPreview(files)
    if (spec.tech === 'html' || spec.tech === 'css') return buildHtmlPreview(files)
    return ''
  }, [files, spec.tech])
  const solutionPreviewDoc = useMemo(() => {
    if (spec.tech === 'react') return buildReactPreview(spec.solutionFiles)
    if (spec.tech === 'javascript') return buildJavaScriptPreview(spec.solutionFiles)
    if (spec.tech === 'html' || spec.tech === 'css') return buildHtmlPreview(spec.solutionFiles)
    return ''
  }, [spec])
  const terminalLines = useMemo(() => getOutput(spec, files, runtimeLines), [spec, files, runtimeLines])

  useEffect(() => {
    setActiveStepIndex(0)
    setStage('briefing')
    const firstSpec = specs[0]
    setActiveFileId(getInitialFileId(firstSpec))
    setFileValues(toFileState(firstSpec.files))
    setResult(null)
    setAttempts(0)
    setShowHint(false)
    setVictory(false)
    setRuntimeLines([])
  }, [lesson.id, specs])

  useEffect(() => {
    setActiveFileId(getInitialFileId(spec))
    setFileValues(toFileState(spec.files))
    setResult(null)
    setAttempts(0)
    setShowHint(false)
    setRuntimeLines([])
  }, [activeStepIndex, spec])

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        await lessonService.startLesson(data.user.id, lesson.id, lesson.track_id)
      }
    })().catch((error) => {
      console.error('[GameMissionExperience] start lesson failed', { lessonId: lesson.id, error })
    })
  }, [lesson.id, lesson.track_id])

  useEffect(() => {
    if (spec.tech !== 'javascript') return
    setRuntimeLines([])
    const onMessage = (event: MessageEvent) => {
      if (event.data?.source !== 'codequest-js-console') return
      setRuntimeLines((current) => [...current.slice(-8), `${event.data.type === 'error' ? 'error' : 'log'}: ${event.data.args.join(' ')}`])
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [spec.tech, previewDoc])

  async function completeMission() {
    const validation = validateMission(files, spec)
    setResult(validation)
    setAttempts((value) => value + 1)
    if (!validation.ok) return

    if (activeStepIndex < specs.length - 1) {
      setResult({ ok: true, kind: 'success', title: 'Etapa concluída', detail: 'Muito bom. Agora avance para o próximo conceito desta lição.' })
      setTimeout(() => {
        setActiveStepIndex((index) => index + 1)
        setStage('learn')
      }, 700)
      return
    }

    setSaving(true)
    try {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push('/auth/login')
        return
      }

      const reward = await lessonService.completeLesson(data.user.id, lesson.id, 100)
      updateProfile({
        xp_total: reward.new_xp,
        level: reward.new_level,
        streak: reward.streak ?? profile?.streak ?? 0,
        best_streak: reward.best_streak ?? profile?.best_streak,
        last_streak_date: reward.last_streak_date ?? profile?.last_streak_date,
      })
      setVictory(true)
      toast.success(reward.already_completed ? 'Missão revisada com sucesso.' : 'Missão concluída. Próxima fase desbloqueada.')
      setTimeout(() => router.push(track ? `/trilhas/${track.slug}` : '/dashboard'), 1800)
    } catch (error: any) {
      console.error('[GameMissionExperience] complete failed', { lessonId: lesson.id, error })
      toast.error(error?.message ?? 'Não consegui salvar sua missão agora.')
    } finally {
      setSaving(false)
    }
  }

  function updateActiveFile(value: string) {
    setFileValues((current) => {
      const next = { ...current, [activeFile.id]: value }
      if (attempts > 0) setResult(validateMission(filesFromState(spec, next), spec))
      return next
    })
  }

  return (
    <AppShell>
      <main className="game-mission-shell">
        <AnimatePresence>
          {victory && (
            <motion.div className="mission-victory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Confetti recycle={false} numberOfPieces={240} />
              <motion.div className="mission-victory-card" initial={{ scale: 0.9, y: 18 }} animate={{ scale: 1, y: 0 }}>
                <div className="mission-kicker">Recompensa desbloqueada</div>
                <AvatarFigure size="lg" presetId={profile?.avatar_preset} skin={profile?.avatar_skin} hair={profile?.avatar_hair} hat={profile?.avatar_hat} top={profile?.avatar_top} shoes={profile?.avatar_shoes} animated pose="victory" emote="happy" />
                <h2>Missão concluída</h2>
                <p>XP salvo, progresso atualizado e próxima fase liberada.</p>
                <div className="mission-reward-row">
                  <span>+{lesson.xp_reward} XP</span>
                  <span>+1 streak</span>
                  <span>{spec.badge}</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <nav className="mission-stepper" aria-label="Etapas da missão">
          {specs.length > 1 && (
            <div className="mission-step mission-step-progress active">
              <span>{activeStepIndex + 1}/{specs.length}</span>
              Conceito
            </div>
          )}
          {[
            ['briefing', 'Missão'],
            ['learn', 'Aprender'],
            ['code', 'Editor'],
          ].map(([key, label], index) => (
            <button key={key} type="button" className={`mission-step ${stage === key ? 'active' : ''}`} onClick={() => setStage(key as MissionStage)}>
              <span>{index + 1}</span>
              {label}
            </button>
          ))}
        </nav>

        {stage === 'briefing' && (
          <motion.section className="mission-briefing" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mission-briefing-copy">
              <div className="mission-kicker">{track?.title ?? 'CodeQuest'} / {spec.badge} / Missão {lesson.order_index}</div>
              <h1>{lesson.title}</h1>
              <p>{lesson.description}</p>
              <div className="mission-stat-grid">
                {specs.length > 1 && <Stat label="Etapa" value={`${activeStepIndex + 1} de ${specs.length}`} />}
                <Stat label="Objetivo" value={spec.objective} />
                <Stat label="Editor" value={spec.badge} />
                <Stat label="Recompensa" value={`+${lesson.xp_reward} XP`} />
                <Stat label="Tempo" value={`${lesson.estimated_minutes ?? 10} min`} />
                <Stat label="Dificuldade" value={difficulty} />
              </div>
              <button className="btn-primary mission-primary-action" type="button" onClick={() => setStage('learn')}>
                Iniciar missão
              </button>
            </div>
            <div className="mission-illustration">
              <div className="mission-planet" />
              <div className="mission-code-orbit">{spec.focus}</div>
              <AvatarFigure size="lg" presetId={profile?.avatar_preset} skin={profile?.avatar_skin} hair={profile?.avatar_hair} hat={profile?.avatar_hat} top={profile?.avatar_top} shoes={profile?.avatar_shoes} animated pose="walk" />
            </div>
          </motion.section>
        )}

        {stage === 'learn' && (
          <motion.section className="mission-learn" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mission-learn-main">
              <div className="mission-kicker">Conceito antes do desafio</div>
              <h1>Entenda {spec.badge} antes de codar</h1>
              <div className="learn-card-grid">
                <LearnCard title="O que e" text={spec.concept} />
                <LearnCard title="Onde usar" text={spec.useCase} />
                <LearnCard title="Como pensar" text={spec.mentalModel} />
              </div>

              <div className="example-split">
                <div className="example-card wrong">
                  <span>Erro comum</span>
                  <code>{spec.files.map((file) => file.value).join('\n\n').slice(0, 220)}</code>
                  <p>Este ponto de partida ainda não cumpre o objetivo. Ele existe para você completar a missão com calma.</p>
                </div>
                <div className="example-card right">
                  <span>Resultado esperado</span>
                  <code>{spec.solutionFiles.map((file) => file.value).join('\n\n').slice(0, 260)}</code>
                  <p>Compare a ideia, não apenas copie. O importante é entender por que funciona.</p>
                </div>
              </div>

              {blocks.map((block: any, index: number) => (
                <div key={index} className="mission-note">
                  <strong>{block.title || block.type || 'Explicacao'}</strong>
                  <p>{block.text || block.body}</p>
                </div>
              ))}
            </div>

            <aside className="mission-demo-panel">
              <div className="mission-card-head">{spec.demoTitle}</div>
              {solutionPreviewDoc ? <iframe className="mission-demo-frame" srcDoc={solutionPreviewDoc} sandbox="allow-scripts" /> : <Terminal lines={getOutput(spec, spec.solutionFiles, [])} />}
              <button className="btn-primary w-full" type="button" onClick={() => setStage('code')}>
                Abrir editor
              </button>
            </aside>
          </motion.section>
        )}

        {stage === 'code' && (
          <motion.section className="mission-code-stage" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mission-editor-wrap">
              <div className="mission-editor-toolbar">
                <div>
                  <div className="mission-kicker">Editor interativo</div>
                  <strong>{spec.badge} Workspace</strong>
                </div>
                <button type="button" className="btn-secondary" onClick={() => setShowHint((value) => !value)}>
                  Dica
                </button>
              </div>
              <div className="mission-file-tabs">
                {files.map((file) => (
                  <button key={file.id} type="button" className={activeFile.id === file.id ? 'active' : ''} onClick={() => setActiveFileId(file.id)}>
                    {file.label}
                  </button>
                ))}
              </div>
              {showHint && <div className="mission-hint">{spec.hint}</div>}
              <Editor
                height="390px"
                language={activeFile.language}
                theme="vs-dark"
                path={activeFile.id}
                value={activeFile.value}
                options={{ minimap: { enabled: false }, fontSize: 14, wordWrap: 'on', tabSize: 2, smoothScrolling: true, padding: { top: 12 } }}
                onChange={(value) => updateActiveFile(value || '')}
              />
            </div>

            <aside className="mission-live-panel">
              <div className="mission-card-head">{spec.outputTitle}</div>
              {previewDoc ? <iframe key={previewDoc} className="mission-live-frame" srcDoc={previewDoc} sandbox="allow-scripts" /> : null}
              <Terminal lines={terminalLines} />
              {result && (
                <div className={`mission-feedback ${result.kind}`}>
                  <strong>{result.title}</strong>
                  <p>{result.detail}</p>
                </div>
              )}
              {!result && <div className="mission-feedback idle">Tente quantas vezes quiser. O sistema valida, explica e deixa você ajustar sem travar.</div>}
              <button className="btn-primary w-full" type="button" onClick={completeMission} disabled={saving}>
                {saving ? 'Salvando progresso...' : activeStepIndex < specs.length - 1 ? 'Validar etapa e continuar' : 'Testar e concluir'}
              </button>
            </aside>
          </motion.section>
        )}
      </main>
    </AppShell>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="mission-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function LearnCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="learn-card">
      <span>{title}</span>
      <p>{text}</p>
    </div>
  )
}

function Terminal({ lines }: { lines: string[] }) {
  return (
    <div className="mission-terminal">
      {lines.map((line, index) => (
        <div key={`${line}-${index}`}>{line}</div>
      ))}
    </div>
  )
}
