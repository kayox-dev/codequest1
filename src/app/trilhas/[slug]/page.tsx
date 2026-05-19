'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { LayoutGroup, motion } from 'framer-motion'
import { AppShell } from '@/components/layout/AppShell'
import { supabase } from '@/lib/supabase'
import { trackService, lessonService } from '@/services/track.service'
import { profileService } from '@/services/auth.service'
import type { Track, Lesson, UserLessonProgress } from '@/types'
import { useAppStore } from '@/store'
import { AvatarFigure } from '@/components/shared/AvatarFigure'
import { getTrackArt } from '@/lib/track-art'

export default function Trilha() {
  const params = useParams()
  const slug = String(params.slug)
  const { profile, updateProfile, setCurrentTrack } = useAppStore()
  const [track, setTrack] = useState<Track | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [progress, setProgress] = useState<Record<string, UserLessonProgress>>({})
  const [bootstrapped, setBootstrapped] = useState(false)

  useEffect(() => {
    ;(async () => {
      const t = await trackService.getTrackBySlug(slug)
      if (!t) return
      setTrack(t)
      const ls = await lessonService.getLessonsForTrack(t.id)
      setLessons(ls)

      const { data } = await supabase.auth.getUser()
      const user = data.user
      if (user) {
        if (profile?.selected_track_id !== t.id) {
          const updatedProfile = await profileService.updateProfile(user.id, { selected_track_id: t.id })
          updateProfile(updatedProfile)
        }

        const ps = await lessonService.getUserLessonProgress(user.id, t.id)
        const map = Object.fromEntries(ps.map((p) => [p.lesson_id, p])) as Record<string, UserLessonProgress>
        setProgress(map)
        if (!ps.length && ls[0] && !bootstrapped) {
          setBootstrapped(true)
          try {
            await trackService.startTrack(user.id, t.id)
            const trackProgress = await trackService.getTrackProgress(user.id, t.id)
            setCurrentTrack(t, trackProgress)
            const refreshed = await lessonService.getUserLessonProgress(user.id, t.id)
            setProgress(Object.fromEntries(refreshed.map((p) => [p.lesson_id, p])) as Record<string, UserLessonProgress>)
          } catch (e: any) {
            toast.error(e.message)
          }
        } else {
          const trackProgress = await trackService.getTrackProgress(user.id, t.id)
          setCurrentTrack(t, trackProgress)
        }
      }
    })()
  }, [slug, bootstrapped, profile?.selected_track_id, updateProfile, setCurrentTrack])

  const right = useMemo(
    () => (
      <>
        <div>
          <div className="rp-title">Trilha atual</div>
          <div className="rp-card">
            <div className="text-4xl mb-2">{track?.icon}</div>
            <div className="font-display font-bold">{track?.title}</div>
            <div className="text-t3 text-xs mt-1">
              {lessons.filter((l) => progress[l.id]?.status === 'completed').length}/{lessons.length} lições concluídas
            </div>
            <div className="xpbar mt-3">
              <div
                className="xpfill"
                style={{ width: `${lessons.length ? Math.round((lessons.filter((l) => progress[l.id]?.status === 'completed').length / lessons.length) * 100) : 0}%` }}
              />
            </div>
          </div>
        </div>
        <div>
          <div className="rp-title">Dica</div>
          <div className="rp-card">
            <div className="text-xs text-t2 leading-relaxed">
              Clique na fase atual para jogar. Fases bloqueadas liberam ao concluir a anterior.
            </div>
          </div>
        </div>
      </>
    ),
    [track, lessons, progress],
  )

  if (!track) return <AppShell><main className="page-main">Carregando trilha...</main></AppShell>

  function statusFor(l: Lesson) {
    return progress[l.id]?.status ?? (lessons[0]?.id === l.id ? 'available' : 'locked')
  }

  const doneCount = lessons.filter((l) => statusFor(l) === 'completed').length
  const activeIndex = lessons.findIndex((l) => {
    const s = statusFor(l)
    return s === 'available' || s === 'in_progress'
  })
  const currentIndex = activeIndex >= 0 ? activeIndex : Math.max(lessons.length - 1, 0)

  return (
    <AppShell rightPanel={right}>
      <main className="page-main trail-main">
        <div className="section-hero trail-section-hero">
          <div className="trail-hero-copy">
            <div className="sh-meta">Mapa de trilha</div>
            <h1 className="sh-title trail-title">
              {track.title}
            </h1>
            <div className="trail-compact-meta">
              <span>{doneCount}/{lessons.length} lições</span>
              <span>{track.difficulty}</span>
              <span>{track.total_xp} XP</span>
            </div>
          </div>
          <div className="trail-hero-art">
            <Image src={getTrackArt(track)} alt="" aria-hidden="true" width={320} height={200} unoptimized priority />
            <span>{track.icon}</span>
          </div>
        </div>

        <div className="stars-row">
          <span className="star earned">★</span>
          <span className="star earned">★</span>
          <span className="star">★</span>
        </div>

        <LayoutGroup id={`trail-${track.slug}`}>
          <div className="trail-list">
          {lessons.map((l, i) => {
            const s = statusFor(l)
            const done = s === 'completed'
            const unlocked = s === 'available' || s === 'in_progress' || done
            const active = unlocked && !done
            const isCurrent = i === currentIndex
            const actionLabel = done ? 'Revisar missão' : s === 'in_progress' ? 'Continuar missão' : 'Começar missão'
            return (
              <div key={l.id} className="trail-item">
                {isCurrent && (
                  <motion.div className="trail-avatar-marker" layout layoutId="trail-avatar" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
                    <AvatarFigure
                      size="sm"
                      presetId={profile?.avatar_preset}
                      skin={profile?.avatar_skin}
                      hair={profile?.avatar_hair}
                      hat={profile?.avatar_hat}
                      top={profile?.avatar_top}
                      shoes={profile?.avatar_shoes}
                      animated
                      pose={done ? 'victory' : 'walk'}
                      emote={done ? 'happy' : l.is_boss ? 'power' : 'none'}
                    />
                  </motion.div>
                )}
                <div className={`trail-node ${done ? 'done-n' : active ? 'active-n' : 'locked-n'}`}>
                  {done ? '✓' : active ? (l.is_boss ? '👑' : '📖') : '🔒'}
                </div>
                {unlocked ? (
                  <Link href={`/trilhas/${track.slug}/missao-${l.order_index}`} className="lesson-info-card text-center">
                    <div className="lic-tag">{done ? 'REVISAR' : 'ATUAL'}</div>
                    <div className="lic-title">{l.title}</div>
                    <div className="lic-desc">{l.description}</div>
                    <div className="lic-xp justify-center">⚡ +{l.xp_reward} XP</div>
                    <div className="btn-primary w-full">{actionLabel}</div>
                  </Link>
                ) : (
                  <div className="locked-lesson">
                    <div className="trail-node locked-n" style={{ width: 48, height: 48, fontSize: 18 }}>
                      🔒
                    </div>
                    <div className="ll-info">
                      <div className="ll-title">{l.title}</div>
                      <div className="ll-sub">Complete a missão anterior para desbloquear</div>
                    </div>
                    <div className="ll-num">{i + 1}</div>
                  </div>
                )}
                {i < lessons.length - 1 && <div className={`trail-line ${done ? 'done-l' : ''}`} />}
              </div>
            )
          })}
          </div>
        </LayoutGroup>
      </main>
    </AppShell>
  )
}
