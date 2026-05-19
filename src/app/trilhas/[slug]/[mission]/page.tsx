'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { GameMissionExperience } from '@/components/lessons/GameMissionExperience'
import { lessonService, trackService } from '@/services/track.service'
import { profileService } from '@/services/auth.service'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store'
import type { Lesson, Track } from '@/types'

export default function MissionRoute() {
  const params = useParams()
  const slug = String(params.slug)
  const mission = String(params.mission)
  const [track, setTrack] = useState<Track | null>(null)
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [missing, setMissing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { profile, updateProfile, setCurrentTrack } = useAppStore()

  useEffect(() => {
    ;(async () => {
      try {
        setError(null)
        setMissing(false)
        setTrack(null)
        setLesson(null)

        const match = mission.match(/^missao-(\d+)$/)
        if (!match) {
          setMissing(true)
          return
        }

        const missionNumber = Number(match[1])
        const currentTrack = await trackService.getTrackBySlug(slug)
        if (!currentTrack) {
          setMissing(true)
          return
        }

        const currentLesson =
          (await lessonService.getLessonByTrackOrder(currentTrack.id, missionNumber)) ??
          (await lessonService.getLessonsForTrack(currentTrack.id)).find((item) => item.order_index === missionNumber)

        if (!currentLesson) {
          setMissing(true)
          return
        }

        if (currentLesson.track_id !== currentTrack.id) {
          setMissing(true)
          return
        }

        const { data } = await supabase.auth.getUser()
        if (data.user) {
          if (profile?.selected_track_id !== currentTrack.id) {
            const updatedProfile = await profileService.updateProfile(data.user.id, { selected_track_id: currentTrack.id })
            updateProfile(updatedProfile)
          }
          const progress = await trackService.getTrackProgress(data.user.id, currentTrack.id)
          setCurrentTrack(currentTrack, progress)
        }

        setTrack(currentTrack)
        setLesson(currentLesson)
      } catch (routeError: any) {
        console.error('[MissionRoute] failed to load mission', {
          slug,
          mission,
          routeError,
        })
        setError(routeError?.message ?? 'Não consegui carregar esta missão.')
      }
    })()
  }, [slug, mission, profile?.selected_track_id, updateProfile, setCurrentTrack])

  if (missing) return <main className="auth-shell">Missão não encontrada.</main>
  if (error) return <main className="auth-shell">{error}</main>
  if (!track || !lesson) return <main className="auth-shell">Carregando missão...</main>

  return <GameMissionExperience lesson={lesson} track={track} />
}
