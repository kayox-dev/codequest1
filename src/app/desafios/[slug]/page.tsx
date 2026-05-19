'use client'

import Editor from '@monaco-editor/react'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { AppShell } from '@/components/layout/AppShell'
import { supabase } from '@/lib/supabase'
import { xpService } from '@/services/xp.service'
import { useAppStore } from '@/store'
import { challenges } from '../challenges'

type ChallengeFile = {
  id: string
  label: string
  language: string
  value: string
}

type ChallengeSpec = {
  files: ChallengeFile[]
  checks: { file: string; includes: string[]; message: string }[]
  feedback: string
}

const fileById = (files: ChallengeFile[], id: string) => files.find((file) => file.id === id)?.value ?? ''
const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').replace(/\s*:\s*/g, ':')

function toFileState(files: ChallengeFile[]) {
  return Object.fromEntries(files.map((file) => [file.id, file.value])) as Record<string, string>
}

function filesFromState(spec: ChallengeSpec, values: Record<string, string>) {
  return spec.files.map((file) => ({ ...file, value: values[file.id] ?? '' }))
}

function buildPreview(files: ChallengeFile[]) {
  const html = fileById(files, 'index.html')
  const css = fileById(files, 'style.css')
  const js = fileById(files, 'script.js')
  const app = fileById(files, 'App.jsx')

  if (app) {
    return `<!doctype html><html><head><style>${css}</style><script src="https://unpkg.com/react@18/umd/react.development.js"><\/script><script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script><script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script></head><body><div id="root"></div><script type="text/babel">${app}\nReactDOM.createRoot(document.getElementById('root')).render(<App />)<\/script></body></html>`
  }

  return `<!doctype html><html><head><style>body{font-family:Inter,Arial,sans-serif;margin:0;padding:24px;background:#f8fafc;color:#111827}${css}</style></head><body>${html}<script>${js}<\/script></body></html>`
}

function getChallengeSpec(challenge: (typeof challenges)[number]): ChallengeSpec {
  const source = normalize(`${challenge.slug} ${challenge.tag} ${challenge.title} ${challenge.desc}`)
  const needsJs = source.includes('js') || source.includes('javascript') || source.includes('dom') || source.includes('quiz') || source.includes('todo')
  const needsCss = source.includes('css') || source.includes('estiliz') || source.includes('responsiv') || source.includes('anim') || source.includes('grid') || source.includes('html') || needsJs
  const needsReact = source.includes('react')
  const needsNode = source.includes('node') || source.includes('api') || source.includes('backend')

  if (needsReact) {
    return {
      files: [
        { id: 'App.jsx', label: 'App.jsx', language: 'javascript', value: 'function App() {\n  return <article className="card">Perfil Dev</article>\n}' },
        { id: 'style.css', label: 'style.css', language: 'css', value: '.card {\n  padding: 24px;\n}' },
      ],
      checks: [
        { file: 'App.jsx', includes: ['function app', 'return'], message: 'Crie um componente App que renderiza JSX.' },
        { file: 'style.css', includes: ['.card', 'padding'], message: 'Estilize o componente em style.css.' },
      ],
      feedback: 'React precisa de JSX e estilo quando o enunciado pede interface.',
    }
  }

  if (needsNode) {
    return {
      files: [{ id: 'server.js', label: 'server.js', language: 'javascript', value: "const app = createApi()\n\napp.get('/status', (req, res) => {\n  \n})" }],
      checks: [{ file: 'server.js', includes: ['app.get', 'res.json'], message: 'Crie uma rota backend que responda JSON.' }],
      feedback: 'Desafios Node/API usam arquivo backend e validam a resposta da rota.',
    }
  }

  if (challenge.slug === 'todo-list') {
    return {
      files: [
        { id: 'index.html', label: 'index.html', language: 'html', value: '<main class="app">\n  <h1>Tarefas</h1>\n  <input id="task" placeholder="Nova tarefa" />\n  <button id="add">Adicionar</button>\n  <ul id="list"></ul>\n</main>' },
        { id: 'style.css', label: 'style.css', language: 'css', value: '.app {\n  max-width: 420px;\n  margin: 0 auto;\n  padding: 24px;\n}\n' },
        { id: 'script.js', label: 'script.js', language: 'javascript', value: "const input = document.querySelector('#task')\nconst button = document.querySelector('#add')\nconst list = document.querySelector('#list')\n\n" },
      ],
      checks: [
        { file: 'index.html', includes: ['input', 'button', 'ul'], message: 'O HTML precisa ter input, botão e lista.' },
        { file: 'style.css', includes: ['.app', 'padding'], message: 'O CSS precisa estilizar a área do aplicativo.' },
        { file: 'script.js', includes: ['addeventlistener', 'localstorage'], message: 'O JavaScript precisa ouvir eventos e persistir tarefas com localStorage.' },
      ],
      feedback: 'Este desafio exige HTML, CSS e JavaScript funcionando juntos.',
    }
  }

  if (challenge.slug === 'quiz-interativo') {
    return {
      files: [
        { id: 'index.html', label: 'index.html', language: 'html', value: '<main class="quiz">\n  <h1>Quiz</h1>\n  <button data-answer="true">HTML é semântico</button>\n  <p id="score">Pontuação: 0</p>\n</main>' },
        { id: 'style.css', label: 'style.css', language: 'css', value: '.quiz {\n  display: grid;\n  gap: 12px;\n}\n' },
        { id: 'script.js', label: 'script.js', language: 'javascript', value: "const score = document.querySelector('#score')\nconst buttons = document.querySelectorAll('button')\n\n" },
      ],
      checks: [
        { file: 'index.html', includes: ['button', 'score'], message: 'O HTML precisa ter pergunta, botão e área de pontuação.' },
        { file: 'style.css', includes: ['.quiz'], message: 'O CSS precisa estilizar o quiz.' },
        { file: 'script.js', includes: ['addeventlistener', 'textcontent'], message: 'O JavaScript precisa responder ao clique e atualizar a pontuação.' },
      ],
      feedback: 'Quiz interativo exige estrutura, estilo e lógica de clique.',
    }
  }

  if (challenge.slug === 'loading-spinner') {
    return {
      files: [
        { id: 'index.html', label: 'index.html', language: 'html', value: '<main>\n  <div class="spinner" aria-label="Carregando"></div>\n</main>' },
        { id: 'style.css', label: 'style.css', language: 'css', value: '.spinner {\n  width: 48px;\n  height: 48px;\n}\n' },
      ],
      checks: [
        { file: 'index.html', includes: ['spinner'], message: 'O HTML precisa conter o elemento do spinner.' },
        { file: 'style.css', includes: ['@keyframes', 'animation', 'border'], message: 'O CSS precisa criar a animação do spinner.' },
      ],
      feedback: 'Animação CSS precisa de HTML para renderizar e CSS com @keyframes.',
    }
  }

  if (challenge.slug === 'menu-animado') {
    return {
      files: [
        { id: 'index.html', label: 'index.html', language: 'html', value: '<nav class="menu">\n  <button class="menu-button">Menu</button>\n  <a href="#">Início</a>\n  <a href="#">Trilhas</a>\n</nav>' },
        { id: 'style.css', label: 'style.css', language: 'css', value: '.menu {\n  display: flex;\n  gap: 12px;\n}\n.menu-button {\n  padding: 12px 16px;\n}\n' },
      ],
      checks: [
        { file: 'index.html', includes: ['nav', 'button', 'href'], message: 'O HTML precisa ter navegação, botão e links.' },
        { file: 'style.css', includes: ['transition', ':hover'], message: 'O CSS precisa ter transição e estado hover.' },
      ],
      feedback: 'Menu animado combina estrutura de navegação e estados visuais em CSS.',
    }
  }

  if (challenge.slug === 'grid-galeria') {
    return {
      files: [
        { id: 'index.html', label: 'index.html', language: 'html', value: '<section class="gallery">\n  <article>Projeto 1</article>\n  <article>Projeto 2</article>\n  <article>Projeto 3</article>\n</section>' },
        { id: 'style.css', label: 'style.css', language: 'css', value: '.gallery {\n  gap: 16px;\n}\n' },
      ],
      checks: [
        { file: 'index.html', includes: ['gallery', 'article'], message: 'O HTML precisa conter a galeria com itens.' },
        { file: 'style.css', includes: ['display:grid', 'grid-template-columns'], message: 'O CSS precisa usar Grid e colunas.' },
      ],
      feedback: 'Galeria em grid exige uma estrutura de itens e CSS Grid.',
    }
  }

  const files: ChallengeFile[] = [
    { id: 'index.html', label: 'index.html', language: 'html', value: '<main>\n  <section class="card">\n    <h1>Perfil Dev</h1>\n    <p>Estudante CodeQuest</p>\n  </section>\n</main>' },
  ]

  if (needsCss) {
    files.push({ id: 'style.css', label: 'style.css', language: 'css', value: '.card {\n  padding: 24px;\n  border-radius: 12px;\n}\n' })
  }

  if (needsJs) {
    files.push({ id: 'script.js', label: 'script.js', language: 'javascript', value: "const card = document.querySelector('.card')\n\n" })
  }

  return {
    files,
    checks: [
      { file: 'index.html', includes: ['<', 'card'], message: 'Crie a estrutura HTML pedida pelo desafio.' },
      ...(needsCss ? [{ file: 'style.css', includes: ['.card', 'padding'], message: 'Estilize o cartão no arquivo style.css.' }] : []),
      ...(needsJs ? [{ file: 'script.js', includes: ['queryselector'], message: 'Implemente a lógica no arquivo script.js.' }] : []),
    ],
    feedback: needsCss ? 'Este desafio exige HTML e CSS. Os dois arquivos precisam estar completos.' : 'Este desafio exige HTML bem estruturado.',
  }
}

function validateChallenge(spec: ChallengeSpec, files: ChallengeFile[]) {
  for (const check of spec.checks) {
    const code = normalize(fileById(files, check.file))
    const missing = check.includes.find((item) => !code.includes(normalize(item)))
    if (missing) return check.message
  }
  return null
}

export default function ChallengePage() {
  const { slug } = useParams()
  const router = useRouter()
  const { profile, updateProfile } = useAppStore()
  const challenge = challenges.find((item) => item.slug === slug)
  const spec = useMemo(() => challenge ? getChallengeSpec(challenge) : null, [challenge])
  const [activeFileId, setActiveFileId] = useState('')
  const [fileValues, setFileValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [completed, setCompleted] = useState<string[]>([])

  useEffect(() => {
    setCompleted(JSON.parse(localStorage.getItem('codequest-completed-challenges') ?? '[]'))
  }, [])

  useEffect(() => {
    if (!spec) return
    setFileValues(toFileState(spec.files))
    setActiveFileId(spec.files[0]?.id ?? '')
  }, [spec])

  if (!challenge || !spec) return <main className="auth-shell">Desafio não encontrado.</main>
  if ((profile?.level ?? 1) < challenge.level) return <main className="auth-shell">Desafio bloqueado até o nível {challenge.level}.</main>

  const files = filesFromState(spec, fileValues)
  const activeFile = files.find((file) => file.id === activeFileId) ?? files[0]
  const previewDoc = buildPreview(files)

  async function finish() {
    const validationError = validateChallenge(spec, files)
    if (validationError) {
      toast.error(validationError)
      return
    }

    setSaving(true)
    try {
      const { data } = await supabase.auth.getUser()
      if (!data.user) return router.push('/auth/login')

      const alreadyDone = completed.includes(challenge.slug)
      const nextCompleted = alreadyDone ? completed : [...completed, challenge.slug]

      const reward = await xpService.claimChallengeReward({
        userId: data.user.id,
        challengeSlug: challenge.slug,
        xpReward: alreadyDone ? 0 : challenge.xp,
        description: `Desafio concluído: ${challenge.title}`,
      })

      updateProfile({
        xp_total: reward.new_xp,
        level: reward.new_level,
        streak: reward.streak ?? profile?.streak ?? 0,
        best_streak: reward.best_streak ?? profile?.best_streak,
        last_streak_date: reward.last_streak_date ?? profile?.last_streak_date,
      })
      localStorage.setItem('codequest-completed-challenges', JSON.stringify(nextCompleted))
      setCompleted(nextCompleted)

      toast.success(reward.already_claimed || alreadyDone ? 'Desafio revisado.' : `Desafio concluído. +${reward.xp_added} XP salvo.`)
      router.push('/desafios')
    } catch (error: any) {
      console.error('[ChallengePage] finish failed', { slug, error })
      toast.error(error?.message ?? 'Não consegui salvar o desafio.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell>
      <main className="game-mission-shell">
        <section className="mission-briefing challenge-briefing">
          <div className="mission-briefing-copy">
            <div className="mission-kicker">{challenge.mode} / {challenge.diff}</div>
            <h1>{challenge.title}</h1>
            <p>{challenge.desc}</p>
            <div className="mission-stat-grid">
              <div className="mission-stat"><span>Recompensa</span><strong>+{challenge.xp} XP</strong></div>
              <div className="mission-stat"><span>Requisito</span><strong>Nível {challenge.level}</strong></div>
              <div className="mission-stat"><span>Arquivos</span><strong>{spec.files.map((file) => file.label).join(', ')}</strong></div>
              <div className="mission-stat"><span>Modo</span><strong>{challenge.mode}</strong></div>
            </div>
          </div>
          <aside className="mission-live-panel">
            <div className="mission-card-head">Preview</div>
            <iframe className="mission-live-frame" srcDoc={previewDoc} sandbox="allow-scripts" />
          </aside>
        </section>
        <section className="mission-code-stage">
          <div className="mission-editor-wrap">
            <div className="mission-editor-toolbar">
              <div>
                <div className="mission-kicker">Editor do desafio</div>
                <strong>Construa sua solução</strong>
              </div>
            </div>
            <div className="mission-file-tabs">
              {files.map((file) => (
                <button key={file.id} type="button" className={activeFile.id === file.id ? 'active' : ''} onClick={() => setActiveFileId(file.id)}>
                  {file.label}
                </button>
              ))}
            </div>
            <Editor
              height="360px"
              path={activeFile.id}
              language={activeFile.language}
              theme="vs-dark"
              value={activeFile.value}
              options={{ minimap: { enabled: false }, wordWrap: 'on' }}
              onChange={(value) => setFileValues((current) => ({ ...current, [activeFile.id]: value || '' }))}
            />
          </div>
          <aside className="mission-live-panel">
            <div className="mission-feedback idle">{spec.feedback} O XP só entra quando todos os arquivos obrigatórios passam na validação.</div>
            <button className="btn-primary w-full" onClick={finish} disabled={saving}>{saving ? 'Salvando...' : 'Concluir desafio'}</button>
          </aside>
        </section>
      </main>
    </AppShell>
  )
}
