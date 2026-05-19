'use client'

import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { getPostLoginRedirect, profileService } from '@/services/auth.service'
import { useAppStore } from '@/store'

const C = createContext(null)

async function syncPendingAvatar(user: User) {
  const raw = sessionStorage.getItem('cq_pending_avatar')
  if (!raw) return null

  try {
    const pending = JSON.parse(raw) as {
      draft?: {
        username: string
        skill: string
        goal: string
        languages: string[]
        minutes: number
      }
      selectedAvatar?: {
        avatar_url?: string | null
        avatar_preset?: string | null
        avatar_skin?: string | null
        avatar_hair?: string | null
        avatar_hat?: string | null
        avatar_top?: string | null
        avatar_shoes?: string | null
      }
    }

    console.log('[AuthProvider] syncing pending avatar', {
      userId: user.id,
      pending,
    })

    const profile = pending.draft
      ? await profileService.completeOnboarding(user.id, {
          username: pending.draft.username,
          avatar_url: pending.selectedAvatar?.avatar_url ?? null,
          avatar_preset: pending.selectedAvatar?.avatar_preset,
          avatar_skin: pending.selectedAvatar?.avatar_skin,
          avatar_hair: pending.selectedAvatar?.avatar_hair,
          avatar_hat: pending.selectedAvatar?.avatar_hat,
          avatar_top: pending.selectedAvatar?.avatar_top,
          avatar_shoes: pending.selectedAvatar?.avatar_shoes,
          skill_level: pending.draft.skill,
          goal: pending.draft.goal,
          favorite_languages: pending.draft.languages,
          daily_minutes: pending.draft.minutes,
        })
      : await profileService.updateProfile(user.id, pending.selectedAvatar ?? {})

    console.log('[AuthProvider] pending avatar synced', {
      userId: user.id,
      profile,
    })

    sessionStorage.removeItem('cq_pending_avatar')
    sessionStorage.removeItem('cq_onboarding_draft')
    return profile
  } catch (error) {
    console.error('[AuthProvider] failed to sync pending avatar', {
      userId: user.id,
      error,
    })
    return null
  }
}

async function loadProfile(user: User) {
  const syncedProfile = await syncPendingAvatar(user)
  return syncedProfile ?? profileService.getProfile(user.id)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setProfile, setLoadingProfile } = useAppStore()
  const r = useRouter()
  const path = usePathname()

  useEffect(() => {
    let mounted = true
    setLoadingProfile(true)

    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (!mounted) return

      if (error) {
        console.error('[AuthProvider] getSession error', error)
      }

      if (session?.user) {
        try {
          const p = await loadProfile(session.user)
          setProfile(p)
          const target = getPostLoginRedirect(p)
          if (path?.startsWith('/auth')) {
            r.replace(target)
            r.refresh()
          }
        } catch (profileError) {
          console.error('[AuthProvider] load profile error', {
            userId: session.user.id,
            profileError,
          })
          setProfile(null)
        }
      } else {
        setProfile(null)
      }

      setLoadingProfile(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (e, s) => {
      if (e === 'SIGNED_IN' && s?.user) {
        setLoadingProfile(true)
        try {
          const p = await loadProfile(s.user)
          setProfile(p)
          const target = getPostLoginRedirect(p)
          if (path?.startsWith('/auth')) {
            r.replace(target)
            r.refresh()
          }
        } catch (profileError) {
          console.error('[AuthProvider] signed-in profile load error', {
            userId: s.user.id,
            profileError,
          })
        }
        setLoadingProfile(false)
      }

      if (e === 'SIGNED_OUT') {
        setProfile(null)
        r.push('/')
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [path, r, setLoadingProfile, setProfile])

  return <C.Provider value={null}>{children}</C.Provider>
}

export const useAuth = () => useContext(C)
