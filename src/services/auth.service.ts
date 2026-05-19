import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

export const authService = {
  signInWithGoogle() {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  },
  signInWithGitHub() {
    return supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  },
  signInWithEmail(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password })
  },
  signUpWithEmail(email: string, password: string, username: string) {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: { user_name: username },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })
  },
  signOut() {
    return supabase.auth.signOut()
  },
  forgotPassword(email: string) {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?type=recovery`,
    })
  },
}

export const profileService = {
  async refreshDailyStreak(userId: string) {
    const { data, error } = await supabase.rpc('refresh_daily_streak', {
      p_user_id: userId,
    })

    if (error) {
      if (error.code === '42883') return null
      console.error('[profileService.refreshDailyStreak] Supabase error', { userId, error })
      throw error
    }

    return data as {
      streak: number
      best_streak: number
      last_streak_date: string | null
      reset: boolean
    } | null
  },

  async getProfile(userId: string) {
    await this.refreshDailyStreak(userId)

    const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle()

    if (error) {
      console.error('[profileService.getProfile] Supabase error', { userId, error })
      throw error
    }

    return data as Profile | null
  },

  async upsertProfile(userId: string, updates: Partial<Profile>) {
    const payload = {
      ...updates,
      user_id: userId,
    }

    const { data, error, status, statusText } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .maybeSingle()

    console.log('[profileService.upsertProfile] response', {
      userId,
      payload,
      data,
      error,
      status,
      statusText,
    })

    if (error) {
      console.error('[profileService.upsertProfile] Supabase error', { userId, payload, error })
      throw error
    }

    if (data) return data as Profile

    const fallback = await this.getProfile(userId)
    if (fallback) return fallback

    throw new Error('Perfil salvo, mas o Supabase não retornou a linha atualizada.')
  },

  async updateProfile(userId: string, updates: Partial<Profile>) {
    return this.upsertProfile(userId, updates)
  },

  async completeOnboarding(
    userId: string,
    data: {
      username: string | null
      avatar_url: string | null
      avatar_preset?: string | null
      avatar_skin?: string | null
      avatar_hair?: string | null
      avatar_hat?: string | null
      avatar_top?: string | null
      avatar_shoes?: string | null
      skill_level: string
      goal: string
      favorite_languages: string[]
      daily_minutes: number
    },
  ) {
    return this.upsertProfile(userId, { ...data, onboarding_completed: true } as Partial<Profile>)
  },
}
