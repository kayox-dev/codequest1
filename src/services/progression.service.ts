import { supabase } from '@/lib/supabase'
import type { Profile, UserLessonProgress, UserTrackProgress } from '@/types'

type UserMissionReward = {
  mission_key: string
  mission_type: 'daily' | 'weekly' | 'special'
}

type UserChallengeReward = {
  challenge_slug: string
}

export type ProgressionMetrics = {
  profile: Profile | null
  xp: number
  level: number
  streak: number
  selectedTrackId: string | null
  completedLessons: number
  completedLessonsToday: number
  completedLessonsThisWeek: number
  lessonActivityToday: number
  completedTracks: number
  activeTrackProgress: number
  activeTrackLessonsCompleted: number
  challengesCompleted: number
  dailyMissionsCompleted: number
  weeklyMissionsCompleted: number
  specialMissionsCompleted: number
  claimedMissionKeys: string[]
}

export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function getProgressionMetrics(userId: string, profile?: Profile | null): Promise<ProgressionMetrics> {
  const { error: streakError } = await supabase.rpc('refresh_daily_streak', {
    p_user_id: userId,
  })

  if (streakError && streakError.code !== '42883') throw streakError

  const [profileResult, lessonProgressResult, trackProgressResult, missionRewardsResult, challengeRewardsResult] = await Promise.all([
    profile
      ? Promise.resolve({ data: profile, error: null })
      : supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('user_lesson_progress').select('*').eq('user_id', userId),
    supabase.from('user_track_progress').select('*').eq('user_id', userId),
    supabase.from('user_mission_rewards').select('mission_key,mission_type').eq('user_id', userId),
    supabase.from('user_challenge_rewards').select('challenge_slug').eq('user_id', userId),
  ])

  if (profileResult.error) throw profileResult.error
  if (lessonProgressResult.error) throw lessonProgressResult.error
  if (trackProgressResult.error) throw trackProgressResult.error
  if (missionRewardsResult.error && missionRewardsResult.error.code !== '42P01') throw missionRewardsResult.error
  if (challengeRewardsResult.error && challengeRewardsResult.error.code !== '42P01') throw challengeRewardsResult.error

  const currentProfile = profileResult.data as Profile | null
  const lessons = (lessonProgressResult.data ?? []) as UserLessonProgress[]
  const tracks = (trackProgressResult.data ?? []) as UserTrackProgress[]
  const missionRewards = (missionRewardsResult.data ?? []) as UserMissionReward[]
  const challengeRewards = (challengeRewardsResult.data ?? []) as UserChallengeReward[]
  const selectedTrackId = currentProfile?.selected_track_id ?? null
  const activeTrack = selectedTrackId ? tracks.find((item) => item.track_id === selectedTrackId) : null
  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay())
  const completedLessons = lessons.filter((item) => item.status === 'completed')
  const todayKey = getLocalDateString(now)
  const localCompletedChallengeIds =
    typeof window === 'undefined'
      ? []
      : JSON.parse(window.localStorage.getItem('codequest-completed-challenges') ?? '[]')
  const completedChallengeIds = new Set([
    ...(Array.isArray(localCompletedChallengeIds) ? localCompletedChallengeIds : []),
    ...challengeRewards.map((reward) => reward.challenge_slug),
  ])
  const claimedMissionKeys = missionRewards.map((reward) => reward.mission_key)

  return {
    profile: currentProfile,
    xp: currentProfile?.xp_total ?? 0,
    level: currentProfile?.level ?? 1,
    streak: currentProfile?.streak ?? 0,
    selectedTrackId,
    completedLessons: completedLessons.length,
    completedLessonsToday: completedLessons.filter((item) => item.completed_at && new Date(item.completed_at) >= startOfToday).length,
    completedLessonsThisWeek: completedLessons.filter((item) => item.completed_at && new Date(item.completed_at) >= startOfWeek).length,
    lessonActivityToday: (currentProfile?.last_streak_date ?? currentProfile?.streak_last_date) === todayKey ? 1 : 0,
    completedTracks: tracks.filter((item) => item.is_completed).length,
    activeTrackProgress: activeTrack?.progress_percent ?? 0,
    activeTrackLessonsCompleted: activeTrack?.lessons_completed ?? 0,
    challengesCompleted: completedChallengeIds.size,
    dailyMissionsCompleted: missionRewards.filter((reward) => reward.mission_type === 'daily').length,
    weeklyMissionsCompleted: missionRewards.filter((reward) => reward.mission_type === 'weekly').length,
    specialMissionsCompleted: missionRewards.filter((reward) => reward.mission_type === 'special').length,
    claimedMissionKeys,
  }
}

export function percent(current: number, required: number) {
  if (required <= 0) return 100
  return Math.max(0, Math.min(100, Math.round((current / required) * 100)))
}
