'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const skillLevels = ['iniciante', 'intermediario', 'avancado']
const goals = ['subir de nível', 'liberar boss', 'dominar trilhas', 'virar lenda']
const langs = ['Frontend', 'Backend', 'Python', 'Java', 'PHP', 'Cybersecurity', 'AI Engineer', 'Mobile', 'DevOps', 'Game Development']

type Draft = {
  username: string
  skill: string
  goal: string
  languages: string[]
  minutes: number
}

export default function Onboarding() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [skill, setSkill] = useState('iniciante')
  const [goal, setGoal] = useState('subir de nível')
  const [chosen, setChosen] = useState<string[]>(['Frontend'])
  const [minutes, setMinutes] = useState(30)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      const user = data.user
      if (!user) {
        router.push('/auth/login')
        return
      }

      setUsername(user.user_metadata?.user_name || user.email?.split('@')[0] || 'developer')
      const raw = sessionStorage.getItem('cq_onboarding_draft')
      if (raw) {
        try {
          const draft = JSON.parse(raw) as Draft
          setUsername(draft.username || '')
          setSkill(draft.skill || 'iniciante')
          setGoal(draft.goal || 'subir de nível')
          setChosen(draft.languages || ['Frontend'])
          setMinutes(draft.minutes || 30)
        } catch {}
      }
    })()
  }, [router])

  function continueToAvatar() {
    const draft: Draft = { username: username.trim(), skill, goal, languages: chosen, minutes }
    sessionStorage.setItem('cq_onboarding_draft', JSON.stringify(draft))
    router.push('/onboarding/avatar')
  }

  return (
    <main className="auth-shell bg-grid onboarding-shell">
      <section className="profile-creator">
        <div className="onboarding-hero">
          <div>
            <div className="sb-s-tag">Criacao premium</div>
            <h1 className="font-display text-4xl font-extrabold mt-1">Monte sua identidade de jogador</h1>
            <p className="text-t2 mt-2 max-w-2xl">
              Primeiro você define a base do personagem. Depois abre a oficina do avatar.
            </p>
          </div>
          <div className="onboarding-hero-badge">
            <div className="text-3xl">🪐</div>
            <div>
              <div className="text-[10px] uppercase tracking-[.18em] text-t3">Etapa atual</div>
              <div className="font-display text-lg font-extrabold">1 de 2</div>
            </div>
          </div>
        </div>

        <div className="wizard-progress">
          <div className="wizard-dot active">1</div>
          <div className="wizard-line" />
          <div className="wizard-dot">2</div>
        </div>
        <div className="onboarding-progress-rail">
          <div className="onboarding-progress-info">
            <span>Campanha de criação</span>
            <strong>Etapa 1 ativa</strong>
          </div>
          <div className="onboarding-progress-bar">
            <div className="onboarding-progress-fill" />
          </div>
          <div className="onboarding-progress-labels">
            <span>Identidade</span>
            <span>Avatar</span>
          </div>
        </div>

        <div className="wizard-grid">
          <div className="space-y-4">
            <div className="onboarding-panel">
              <div className="onboarding-panel-head">
                <div>
                  <div className="text-xs uppercase tracking-[.18em] text-t3">Dados do jogador</div>
                  <div className="font-display text-xl font-extrabold mt-1">Escolha a base do seu perfil</div>
                </div>
                <div className="onboarding-panel-chip">Pronto para o avatar</div>
              </div>

              <div className="space-y-4">
                <FieldCard label="Seu nome" value={username || 'nome de guerra'}>
                  <input className="input-field" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Seu nome de guerra" />
                </FieldCard>

                <FieldCard label="Seu nível" value={`Nível ${skill}`}>
                  <div className="choice-grid choice-grid-3">
                    {skillLevels.map((x) => (
                      <button key={x} onClick={() => setSkill(x)} className={`choice-card ${skill === x ? 'active' : ''}`}>
                        <span className="choice-title">{x}</span>
                        <span className="choice-sub">Perfil do jogador</span>
                      </button>
                    ))}
                  </div>
                </FieldCard>

                <FieldCard label="Sua missão principal" value={goal}>
                  <div className="choice-grid">
                    {goals.map((x) => (
                      <button key={x} onClick={() => setGoal(x)} className={`choice-card ${goal === x ? 'active' : ''}`}>
                        <span className="choice-title">{x}</span>
                        <span className="choice-sub">Objetivo da campanha</span>
                      </button>
                    ))}
                  </div>
                </FieldCard>

                <FieldCard label="Skills favoritas" value={`${chosen.length} selecionadas`}>
                  <div className="choice-grid choice-grid-2">
                    {langs.map((x) => (
                      <button
                        key={x}
                        onClick={() => setChosen((c) => (c.includes(x) ? c.filter((i) => i !== x) : [...c, x]))}
                        className={`choice-card choice-card-small ${chosen.includes(x) ? 'active' : ''}`}
                      >
                        <span className="choice-title">{x}</span>
                        <span className="choice-sub">{chosen.includes(x) ? 'Selecionada' : 'Toque para marcar'}</span>
                      </button>
                    ))}
                  </div>
                </FieldCard>

                <div className="onboarding-range">
                  <div className="flex items-center justify-between text-sm font-semibold mb-2">
                    <span>Tempo por dia</span>
                    <span className="text-accent-2">{minutes} min</span>
                  </div>
                  <input type="range" min="15" max="120" step="15" value={minutes} onChange={(e) => setMinutes(+e.target.value)} className="w-full" />
                  <div className="text-xs text-t3 mt-2">Seu ritmo de campanha atual</div>
                </div>
              </div>
            </div>

            <button className="btn-primary w-full py-3" onClick={continueToAvatar} disabled={!username.trim()}>
              Ir para criar avatar
            </button>
          </div>

          <div className="profile-preview">
            <div className="profile-preview-card">
              <div className="text-xs uppercase tracking-[.18em] text-t3 mb-3">Resumo do jogador</div>
              <div className="preview-hero-card">
                <div className="preview-hero-top">
                  <div>
                    <div className="preview-hero-label">Ficha ativa</div>
                    <div className="preview-hero-name">{username || '—'}</div>
                  </div>
                  <div className="preview-hero-level">
                    <span>Nível</span>
                    <strong>{skill}</strong>
                  </div>
                </div>
                <div className="preview-hero-meta">
                  <span>Missão: {goal}</span>
                  <span>{minutes} min por dia</span>
                </div>
              </div>
              <div className="preview-stack">
                <PreviewTile label="Nome de guerra" value={username || '—'} />
                <PreviewTile label="Seu nível" value={`Nível ${skill}`} />
                <PreviewTile label="Missão principal" value={goal} />
                <PreviewTile label="Tempo de treino" value={`${minutes} min/dia`} />
              </div>

              <div className="mt-4 rp-card">
                <div className="text-xs uppercase tracking-[.18em] text-t3 mb-2">Favoritas</div>
                <div className="flex flex-wrap gap-2">
                  {chosen.map((x) => (
                    <span key={x} className="xp-pill">
                      {x}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-3 rp-card">
                <div className="text-xs uppercase tracking-[.18em] text-t3 mb-2">Proximo passo</div>
                <div className="text-sm text-t2">A próxima tela é só para montar o avatar, sem misturar com os dados do jogador.</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function FieldCard({ label, value, children }: { label: string; value: ReactNode; children: ReactNode }) {
  return (
    <div className="field-card">
      <div className="field-card-head">
        <div>
          <div className="field-label">{label}</div>
          <div className="field-value">{value}</div>
        </div>
      </div>
      {children}
    </div>
  )
}

function PreviewTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="preview-tile">
      <span className="preview-label">{label}</span>
      <span className="preview-value">{value}</span>
    </div>
  )
}
