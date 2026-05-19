'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AppShell } from '@/components/layout/AppShell'
import { useAppStore } from '@/store'
import { supabase } from '@/lib/supabase'
import { trackService, lessonService } from '@/services/track.service'
import type { Track, Lesson, UserTrackProgress } from '@/types'
import { getTrackArt } from '@/lib/track-art'
import { getEquippedPlayerTag } from '@/lib/player-tags'

type MissionCard = { title: string; sub: string; xp: string; pct: number; done?: boolean }
type ChallengeCard = { title: string; badge: string; diff: 'Fácil' | 'Médio' | 'Difícil' }

export default function Dashboard() {
  const { profile, loadingProfile, setCurrentTrack } = useAppStore()
  const [track, setTrack] = useState<Track | null>(null)
  const [progress, setProgress] = useState<UserTrackProgress | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [next, setNext] = useState<Lesson | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const equippedTag = getEquippedPlayerTag(profile)

  useEffect(() => {
    if (loadingProfile) return
    let active = true

    ;(async () => {
      setLoadingData(true)
      const { data } = await supabase.auth.getUser()
      const user = data.user
      if (!user) {
        if (active) setLoadingData(false)
        return
      }

      if (!profile?.selected_track_id) {
        if (!active) return
        setTrack(null)
        setProgress(null)
        setLessons([])
        setNext(null)
        setLoadingData(false)
        return
      }

      const selected = await trackService.getTrackById(profile.selected_track_id)
      if (!active) return
      if (!selected) {
        setTrack(null)
        setProgress(null)
        setLessons([])
        setNext(null)
        setLoadingData(false)
        return
      }

      setTrack(selected)
      const ls = await lessonService.getLessonsForTrack(selected.id)
      if (!active) return
      setLessons(ls)
      const { data: p } = await supabase.from('user_track_progress').select('*').eq('user_id', user.id).eq('track_id', selected.id).maybeSingle()
      if (!active) return
      if (p) {
        const trackProgress = p as UserTrackProgress
        setProgress(trackProgress)
        setCurrentTrack(selected, trackProgress)
        if (p.current_lesson_id) {
          const current = await lessonService.getLesson(p.current_lesson_id)
          setNext(current?.track_id === selected.id ? current : await lessonService.getUnlockedLessonForTrack(user.id, selected.id))
        }
      } else if (ls[0]) {
        setCurrentTrack(selected, null)
        setNext(ls[0])
      }
      setLoadingData(false)
    })().catch((error) => {
      console.error('[Dashboard] failed to load data', error)
      if (active) setLoadingData(false)
    })

    return () => {
      active = false
    }
  }, [loadingProfile, profile?.selected_track_id, setCurrentTrack])

  const steps = useMemo(() => {
    return lessons.slice(0, 7).map((l, i) => {
      const unlocked = i === 0 || Boolean(progress?.lessons_completed && i < progress.lessons_completed + 1) || progress?.current_lesson_id === l.id
      const done = Boolean(progress && progress.current_lesson_id && i < (progress.lessons_completed ?? 0))
      const active = !done && (progress?.current_lesson_id === l.id || (i === 0 && !progress))
      return { lesson: l, done, active, unlocked }
    })
  }, [lessons, progress])

  const missions: MissionCard[] = [
    { title: 'Complete 1 lição', sub: 'Trilha atual', xp: '+50 XP', pct: Math.min((progress?.lessons_completed ?? 0) * 100, 100), done: (progress?.lessons_completed ?? 0) > 0 },
    { title: 'Teste seu código', sub: 'Editor', xp: '+75 XP', pct: 0 },
    { title: 'Mantenha seu streak', sub: 'Geral', xp: '+30 XP', pct: profile?.streak ? 100 : 0, done: Boolean(profile?.streak) },
  ]

  const challenges: ChallengeCard[] = [
    { title: 'Landing Page Responsiva', badge: 'Difícil', diff: 'Difícil' },
    { title: 'Menu Animado', badge: 'Médio', diff: 'Médio' },
    { title: 'Formulário Completo', badge: 'Fácil', diff: 'Fácil' },
  ]

  const right = (
    <>
      <div>
        <div className="rp-title">Resumo da jornada</div>
        <div className="rp-card">
          <div className="text-sm font-semibold mb-1">{track?.title ?? 'Nenhuma trilha'}</div>
          <div className="text-t3 text-xs mb-3">{progress?.progress_percent ?? 0}% concluído</div>
          <div className="xpbar">
            <div className="xpfill" style={{ width: `${progress?.progress_percent ?? 0}%` }} />
          </div>
        </div>
      </div>
      <div>
        <div className="rp-title">Nível atual</div>
        <div className="rp-card">
          <div className="flex items-center gap-3">
            <div className="th-lvlbadge">
              <span>nível</span>
              <span>{profile?.level ?? 1}</span>
            </div>
            <div>
              <div className="font-display font-bold">{equippedTag ? equippedTag.name : 'Developer'}</div>
              <div className="text-t2 text-xs">{profile?.xp_total ?? 0} XP total</div>
            </div>
          </div>
        </div>
      </div>
      <div>
        <div className="rp-title">Boss da trilha</div>
        <div className="rp-card">
          <div className="text-3xl mb-2">👾</div>
          <div className="font-bold text-accent-2">Projeto Final</div>
          <p className="text-t2 text-xs mt-1">Desbloqueado ao concluir todas as fases.</p>
        </div>
      </div>
    </>
  )

  return (
    <AppShell rightPanel={right}>
      <main className="dash-main">
        {loadingData && <div className="mission-feedback idle">Carregando sua jornada...</div>}
        <div>
          <div className="welcome">Bem-vindo de volta, {profile?.username || 'Developer'}! 👋</div>
          <div className="welcome-sub">{equippedTag ? `${equippedTag.icon} ${equippedTag.name}` : 'Continue sua jornada e evolua suas habilidades.'}</div>
        </div>

        <section className="trail-hero">
          <div className="trail-hero-icon trail-hero-icon-art">
            <Image src={getTrackArt(track)} alt="" aria-hidden="true" width={320} height={200} unoptimized />
            <span>{track?.icon ?? 'FE'}</span>
          </div>
          <div className="trail-hero-meta">
            <div className="th-lbl">Sua trilha atual</div>
            <div className="th-name">{track?.title ?? 'Escolha uma trilha'}</div>
          </div>
          <div className="th-lvlbadge">
            <span>nível</span>
            <span>{profile?.level ?? 1}</span>
          </div>
          <div className="th-xp">
            <div className="th-xp-txt">{profile?.xp_total ?? 0} XP</div>
            <div className="xpbar">
              <div className="xpfill" style={{ width: `${progress?.progress_percent ?? 0}%` }} />
            </div>
          </div>
          <div>
            <div className="th-pct">{progress?.progress_percent ?? 0}%</div>
            <div className="th-pct-lbl">de conclusão</div>
          </div>
        </section>

        <div>
          <div className="sec-title">Continue aprendendo</div>
          <div className="steps-h">
            {steps.map((s, i) => (
              <Fragment key={s.lesson.id}>
                <div key={s.lesson.id} className="step-node">
                  <div className={`step-c ${s.done ? 'done' : s.active ? 'active' : 'locked'}`}>
                    {s.done ? '✓' : s.active ? '📖' : '🔒'}
                  </div>
                  <div className="step-lbl">{s.lesson.title}</div>
                </div>
                {i < steps.length - 1 && <div className={`step-line ${s.done ? 'done' : ''}`} />}
              </Fragment>
            ))}
          </div>

          <div className="lesson-card">
            <div className="lc-icon">💻</div>
            <div className="lc-info">
              <div className="lc-title">{next?.title ?? 'Primeira trilha ainda não escolhida'}</div>
              <div className="lc-desc">{next?.description ?? 'Escolha uma trilha para começar com tudo zerado.'}</div>
              <div className="xp-pill">⚡ +{next?.xp_reward ?? 0} XP</div>
            </div>
            <Link className="btn-primary" href={next && track ? `/trilhas/${track.slug}/missao-${next.order_index}` : track ? `/trilhas/${track.slug}` : '/escolha-trilha'}>
              {next ? 'Começar missão' : 'Começar'} ›
            </Link>
          </div>
        </div>

        <div>
          <div className="missions-hdr">
            <div className="sec-title" style={{ marginBottom: 0 }}>
              Missões diárias
            </div>
            <div className="timer-lbl">🕐 Atualiza em 14h 22m</div>
          </div>
          <div className="missions-grid">
            {missions.map((m) => (
              <div className="mc" key={m.title}>
                <div className="mc-top">
                  <div className="mc-icon" style={{ background: m.title.includes('streak') ? 'var(--green-dim)' : m.title.includes('código') ? 'rgba(77,187,255,.1)' : 'var(--accent-dim)' }}>
                    {m.title.includes('streak') ? '🔥' : m.title.includes('código') ? '🖼' : '📖'}
                  </div>
                  <div>
                    <div className="mc-title">{m.title}</div>
                    <div className="mc-sub">{m.sub}</div>
                  </div>
                  {m.done && <div className="mc-check">✓</div>}
                </div>
                <div className="mc-prog">
                  <span>{m.pct ? '1/1' : '0/1'}</span>
                  <span style={{ color: 'var(--accent2)', fontWeight: 600 }}>{m.xp}</span>
                </div>
                <div className="xpbar">
                  <div className="xpfill" style={{ background: m.title.includes('streak') ? 'var(--green)' : 'var(--accent)', width: `${m.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="sec-title" style={{ marginBottom: 0 }}>
              Desafios recomendados
            </div>
            <Link href="/desafios" className="text-[12.5px] text-accent-2">
              Ver todos
            </Link>
          </div>
          <div className="chal-grid">
            {challenges.map((c) => (
              <div className="cc" key={c.title}>
                <div className="cc-title">{c.title}</div>
                <span className={`badge ${c.diff === 'Difícil' ? 'badge-hard' : c.diff === 'Médio' ? 'badge-med' : 'badge-easy'}`}>
                  {c.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </AppShell>
  )
}
