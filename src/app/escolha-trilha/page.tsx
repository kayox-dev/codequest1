'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { profileService } from '@/services/auth.service'
import { lessonService, trackService } from '@/services/track.service'
import type { Track } from '@/types'
import { useAppStore } from '@/store'
import { getTrackArt } from '@/lib/track-art'

export default function Escolha() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState('')
  const router = useRouter()
  const { updateProfile, setCurrentTrack } = useAppStore()

  useEffect(() => {
    trackService
      .getTracks()
      .then(setTracks)
      .catch((error) => {
        console.error('[EscolhaTrilha] failed to load tracks', error)
        toast.error('Não consegui carregar as trilhas. Tente novamente.')
      })
  }, [])

  async function start(track: Track) {
    if (loading) return
    setLoading(track.id)

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) throw sessionError

      const user = session?.user
      if (!user?.id) {
        router.push('/auth/login')
        return
      }

      console.log('[EscolhaTrilha] start track', {
        userId: user.id,
        trackId: track.id,
        slug: track.slug,
      })

      const progress = await trackService.startTrack(user.id, track.id)
      const profile = await profileService.updateProfile(user.id, { selected_track_id: track.id })
      updateProfile(profile)
      setCurrentTrack(track, progress)

      const progressLesson = progress.current_lesson_id ? await lessonService.getLesson(progress.current_lesson_id) : null
      const unlockedLesson =
        (progressLesson?.track_id === track.id ? progressLesson : null) ??
        (await lessonService.getUnlockedLessonForTrack(user.id, track.id)) ??
        (await lessonService.getFirstLessonForTrack(track.id))

      console.log('[EscolhaTrilha] track ready', {
        userId: user.id,
        trackId: track.id,
        progress,
        unlockedLesson,
      })

      if (!unlockedLesson?.id) {
        toast.error('Nao foi possivel iniciar esta trilha agora.')
        router.push(`/trilhas/${track.slug}`)
        return
      }

      toast.success(progress.lessons_completed > 0 ? 'Voltando para sua fase desbloqueada.' : 'Trilha iniciada!')
      router.push(`/trilhas/${track.slug}/missao-${unlockedLesson.order_index}`)
    } catch (error: any) {
      console.error('[EscolhaTrilha] start failed', {
        trackId: track.id,
        slug: track.slug,
        error,
      })
      toast.error(error?.message ?? 'Não consegui iniciar a trilha. Tente novamente.')
    } finally {
      setLoading('')
    }
  }

  return (
    <main className="auth-shell escolha-trilha-shell">
      <section className="w-full max-w-5xl">
        <div className="section-hero escolha-trilha-hero">
          <div>
            <div className="sh-meta">Primeiro passo</div>
            <div className="sh-title">Escolha sua primeira trilha</div>
            <p className="text-white/70 text-sm mt-2">A primeira missão abre na hora; se você já começou, vamos para a fase desbloqueada.</p>
          </div>
          <div className="text-4xl">🗺️</div>
        </div>

        <div className="grid-cards escolha-trilha-grid">
          {tracks.map((track) => {
            const isLoading = loading === track.id

            return (
              <article key={track.id} className="card escolha-trilha-card">
                <div className="track-art-card">
                  <Image src={getTrackArt(track)} alt="" aria-hidden="true" width={320} height={200} unoptimized />
                  <div className="track-art-badge">{track.icon}</div>
                </div>
                <div className="escolha-trilha-copy">
                  <h2 className="font-display text-xl font-bold">{track.title}</h2>
                  <p className="text-t2 text-sm mt-2">{track.description}</p>
                </div>
                <div className="escolha-trilha-meta">
                  <span>{track.difficulty}</span>
                  <span>{track.total_lessons} lições</span>
                  <span>{track.total_xp} XP</span>
                </div>
                <button type="button" disabled={Boolean(loading)} onClick={() => start(track)} className="btn-primary w-full">
                  {isLoading ? 'Entrando na trilha...' : 'Começar trilha'}
                </button>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}
