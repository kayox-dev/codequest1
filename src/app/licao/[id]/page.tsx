'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { GameMissionExperience } from '@/components/lessons/GameMissionExperience'
import { lessonService, trackService } from '@/services/track.service'
import type { Lesson, Track } from '@/types'

export default function Licao() {
  const { id } = useParams()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [track, setTrack] = useState<Track | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        setError(null)
        const nextLesson = await lessonService.getLesson(String(id))
        setLesson(nextLesson)

        if (nextLesson) {
          const tracks = await trackService.getTracks()
          setTrack(tracks.find((item) => item.id === nextLesson.track_id) ?? null)
        }
      } catch (routeError: any) {
        console.error('[LegacyLessonRoute] failed to load mission', {
          id,
          routeError,
        })
        setError(routeError?.message ?? 'Não consegui carregar esta missão.')
      }
    })()
  }, [id])

  if (error) {
    return <main className="auth-shell">{error}</main>
  }

  if (!lesson) {
    return <main className="auth-shell">Carregando missão...</main>
  }

  return <GameMissionExperience lesson={lesson} track={track} />
}
