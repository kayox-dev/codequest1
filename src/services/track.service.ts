import { supabase } from '@/lib/supabase'
import type { CompleteLessonResult, Lesson, Track, UserLessonProgress, UserTrackProgress } from '@/types'

export const FINAL_TRACK_SLUGS = [
  'frontend',
  'backend',
  'python',
  'java',
  'php',
  'cybersecurity',
  'ai-engineer',
  'mobile',
  'devops',
  'game-development',
] as const

const TRACK_SLUG_ALIASES: Record<string, (typeof FINAL_TRACK_SLUGS)[number]> = {
  html: 'frontend',
  'html-css': 'frontend',
  'html-e-css': 'frontend',
  css: 'frontend',
  javascript: 'frontend',
  react: 'frontend',
  typescript: 'frontend',
  'ui-ux': 'frontend',
  uiux: 'frontend',
  acessibilidade: 'frontend',
  responsividade: 'frontend',
  'projetos-praticos': 'frontend',
  nodejs: 'backend',
  apis: 'backend',
  'banco-de-dados': 'backend',
  database: 'backend',
  git: 'devops',
  'seguranca-web': 'cybersecurity',
  seguranca: 'cybersecurity',
  security: 'cybersecurity',
}

export function resolveTrackSlug(slug: string) {
  return TRACK_SLUG_ALIASES[slug] ?? slug
}

export type LessonActivityStreakResult = {
  streak: number
  best_streak: number
  last_streak_date: string
  counted_today: boolean
  incremented: boolean
}

export const trackService = {
  async getTracks() {
    const { data, error } = await supabase.from('tracks').select('*').eq('is_active', true).in('slug', [...FINAL_TRACK_SLUGS]).order('order_index')
    if (error) throw error
    return (data ?? []) as Track[]
  },

  async getTrackBySlug(slug: string) {
    const { data, error } = await supabase.from('tracks').select('*').eq('slug', resolveTrackSlug(slug)).maybeSingle()
    if (error) throw error
    return data as Track | null
  },

  async getTrackById(trackId: string) {
    const { data, error } = await supabase.from('tracks').select('*').eq('id', trackId).maybeSingle()
    if (error) throw error
    return data as Track | null
  },

  async getSelectedTrack(userId: string) {
    const { data, error } = await supabase.from('profiles').select('selected_track_id').eq('user_id', userId).maybeSingle()
    if (error) throw error
    if (!data?.selected_track_id) return null

    return trackService.getTrackById(data.selected_track_id)
  },

  async startTrack(userId: string, trackId: string) {
    const { data, error } = await supabase.rpc('start_track', { p_user_id: userId, p_track_id: trackId })
    if (error) throw error
    return data as UserTrackProgress
  },

  async getTrackProgress(userId: string, trackId: string) {
    const { data, error } = await supabase
      .from('user_track_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('track_id', trackId)
      .maybeSingle()

    if (error) throw error
    return data as UserTrackProgress | null
  },
}

export const lessonService = {
  async getLessonsForTrack(trackId: string) {
    const { data, error } = await supabase.from('lessons').select('*').eq('track_id', trackId).eq('is_active', true).order('order_index')
    if (error) throw error
    return (data ?? []) as Lesson[]
  },

  async getLesson(id: string) {
    const { data, error } = await supabase.from('lessons').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return data as Lesson | null
  },

  async getFirstLessonForTrack(trackId: string) {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('track_id', trackId)
      .eq('is_active', true)
      .order('order_index')
      .limit(1)

    if (error) throw error
    return ((data ?? [])[0] ?? null) as Lesson | null
  },

  async getLessonByTrackOrder(trackId: string, orderIndex: number) {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('track_id', trackId)
      .eq('is_active', true)
      .eq('order_index', orderIndex)
      .order('created_at')
      .limit(1)

    if (error) throw error
    return ((data ?? [])[0] ?? null) as Lesson | null
  },

  async getUserLessonProgress(userId: string, trackId: string) {
    const { data, error } = await supabase.from('user_lesson_progress').select('*').eq('user_id', userId).eq('track_id', trackId)
    if (error) throw error
    return (data ?? []) as UserLessonProgress[]
  },

  async getUnlockedLessonForTrack(userId: string, trackId: string) {
    const [trackProgress, lessons] = await Promise.all([
      trackService.getTrackProgress(userId, trackId),
      this.getLessonsForTrack(trackId),
    ])

    if (trackProgress?.current_lesson_id) {
      const currentLesson = lessons.find((lesson) => lesson.id === trackProgress.current_lesson_id)
      if (currentLesson) return currentLesson
    }

    const progress = await this.getUserLessonProgress(userId, trackId)
    const progressByLesson = new Map<string, UserLessonProgress>(progress.map((item) => [item.lesson_id, item]))
    return (
      lessons.find((lesson) => {
        const status = progressByLesson.get(lesson.id)?.status
        return status === 'available' || status === 'in_progress'
      }) ??
      lessons[0] ??
      null
    )
  },

  async startLesson(userId: string, lessonId: string, _trackId: string) {
    const { error } = await supabase
      .from('user_lesson_progress')
      .update({ status: 'in_progress', started_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .neq('status', 'completed')

    if (error) throw error
  },

  async completeLesson(userId: string, lessonId: string, score = 100) {
    const { data, error } = await supabase.rpc('complete_lesson', { p_user_id: userId, p_lesson_id: lessonId, p_score: score })
    if (error) throw error
    return data as CompleteLessonResult
  },
}
