'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { AppShell } from '@/components/layout/AppShell'
import { AvatarFigure } from '@/components/shared/AvatarFigure'
import { avatarPresets, getAvatarPreset, isAvatarPresetUnlocked } from '@/components/avatars/avatar-presets'
import { useAppStore } from '@/store'
import { profileService } from '@/services/auth.service'
import { supabase } from '@/lib/supabase'
import { getAvatarUnlockLabel } from '@/components/avatars/avatar-presets'

type AvatarStats = {
  completedTracks: number
  completedLessons: number
  bossWins: number
}

export default function AvatarConfigPage() {
  const router = useRouter()
  const { profile, updateProfile } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [selectedPresetId, setSelectedPresetId] = useState(profile?.avatar_preset || avatarPresets[0]?.id || 'neo-hacker')
  const [ready, setReady] = useState(false)
  const [stats, setStats] = useState<AvatarStats>({ completedTracks: 0, completedLessons: 0, bossWins: 0 })

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push('/auth/login')
        return
      }
      setReady(true)
    })()
  }, [router])

  useEffect(() => {
    if (profile?.avatar_preset) {
      setSelectedPresetId(profile.avatar_preset)
    }
  }, [profile?.avatar_preset])

  const selectedPreset = useMemo(() => getAvatarPreset(selectedPresetId), [selectedPresetId])
  const unlocked = isAvatarPresetUnlocked(selectedPreset, {
    level: profile?.level ?? 1,
    xp: profile?.xp_total ?? 0,
    streak: profile?.streak ?? 0,
    completedTracks: stats.completedTracks,
    completedLessons: stats.completedLessons,
    bossWins: stats.bossWins,
  })

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      const user = data.user
      if (!user) return

      const [{ count: tracksCount }, { count: lessonsCount }, completedLessonsResult, bossLessonsResult] = await Promise.all([
        supabase.from('user_track_progress').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_completed', true),
        supabase.from('user_lesson_progress').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'completed'),
        supabase.from('user_lesson_progress').select('lesson_id').eq('user_id', user.id).eq('status', 'completed'),
        supabase.from('lessons').select('id').eq('is_boss', true),
      ])

      const completedIds = new Set((completedLessonsResult.data ?? []).map((row) => row.lesson_id))
      const bossWins = (bossLessonsResult.data ?? []).filter((lesson) => completedIds.has(lesson.id)).length

      setStats({
        completedTracks: tracksCount ?? 0,
        completedLessons: lessonsCount ?? 0,
        bossWins,
      })
    })()
  }, [])

  async function save() {
    if (!selectedPreset?.id) {
      toast.error('Selecione um avatar antes de salvar.')
      return
    }

    if (!unlocked) {
      toast.error(`Desbloqueie no nível ${selectedPreset.unlockLevel} ou ${selectedPreset.unlockXp} XP.`)
      return
    }

    setLoading(true)
    const selectedAvatar = {
      avatar_preset: selectedPreset.id,
      avatar_skin: selectedPreset.skin,
      avatar_hair: selectedPreset.hair,
      avatar_hat: 'none',
      avatar_top: selectedPreset.outfit,
      avatar_shoes: 'sneakers',
    }

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()
      const user = session?.user

      if (sessionError) {
        console.error('[Avatar config] session error', sessionError)
        throw sessionError
      }

      if (!user?.id) {
        sessionStorage.setItem('cq_pending_avatar', JSON.stringify({ selectedAvatar }))
        toast.error('Sua sessão expirou. Entre novamente para salvar o avatar.')
        router.push('/auth/login')
        return
      }

      const next = await profileService.updateProfile(user.id, selectedAvatar)

      if (!next) {
        console.error('[Avatar config] empty profile response after upsert', {
          userId: user.id,
          selectedAvatar,
        })
        toast.error('Não consegui salvar o avatar. Veja o console para o erro real.')
        return
      }

      updateProfile(next)
      toast.success('Avatar atualizado')
    } catch (error) {
      console.error('[Avatar config] save failed', {
        selectedAvatar,
        error,
      })
      toast.error('Erro ao atualizar o avatar. Veja o console para o erro real.')
    } finally {
      setLoading(false)
    }
  }

  if (!ready) {
    return (
      <AppShell>
        <main className="config-avatar-main">Carregando avatar...</main>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <main className="config-avatar-main">
        <div className="config-avatar-heading">
          <div className="sec-title">Avatar do jogador</div>
          <p>Escolha uma skin, visualize o personagem em tamanho real e salve seu visual para a jornada.</p>
        </div>
        <section className="avatar-lab-layout">
          <div className="avatar-lab-gallery">
            <div className="avatar-lab-header">
              <div>
                <div className="text-xs uppercase tracking-[.18em] text-t3">Skins disponíveis</div>
                <div className="font-display text-2xl font-extrabold mt-1">Escolha seu estilo</div>
              </div>
              <div className="avatar-lab-count">
                {profile?.xp_total ?? 0} XP
              </div>
            </div>
            <div className="avatar-preset-grid">
              {avatarPresets.map((preset) => {
                const selected = preset.id === selectedPresetId
                const allowed = isAvatarPresetUnlocked(preset, {
                  level: profile?.level ?? 1,
                  xp: profile?.xp_total ?? 0,
                  streak: profile?.streak ?? 0,
                  completedTracks: stats.completedTracks,
                  completedLessons: stats.completedLessons,
                  bossWins: stats.bossWins,
                })
                return (
                  <motion.button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      if (!allowed) {
                        toast.error(`Desbloqueie no nível ${preset.unlockLevel} ou ${preset.unlockXp} XP.`)
                        return
                      }
                      setSelectedPresetId(preset.id)
                    }}
                    className={`avatar-preset-card ${selected ? 'active' : ''} ${!allowed ? 'locked' : ''}`}
                    whileHover={{ y: -4, scale: allowed ? 1.02 : 1 }}
                    whileTap={{ scale: allowed ? 0.98 : 1 }}
                  >
                    <div className="avatar-preset-stage">
                      <AvatarFigure presetId={preset.id} size="sm" animated={false} className="avatar-preset-figure" />
                    </div>
                    <div className="avatar-preset-meta">
                      <div className="avatar-preset-name">{preset.name}</div>
                      <div className="avatar-preset-sub">{preset.subtitle}</div>
                    </div>
                    <div className="avatar-preset-tags">
                      <span>{preset.rarity}</span>
                      <span>{preset.tone}</span>
                      <span>{getAvatarUnlockLabel(preset)}</span>
                    </div>
                    {!allowed && (
                      <div className="avatar-preset-lock">
                        <span>Bloqueado</span>
                        <strong>
                          {preset.unlockKind === 'level'
                            ? `Nível ${preset.unlockValue}`
                            : preset.unlockKind === 'xp'
                              ? `${preset.unlockValue} XP`
                              : preset.unlockKind === 'streak'
                                ? `${preset.unlockValue} dias de streak`
                                : preset.unlockKind === 'tracks'
                                  ? `${preset.unlockValue} trilha concluída`
                                  : preset.unlockKind === 'lessons'
                                    ? `${preset.unlockValue} lições concluídas`
                                    : `${preset.unlockValue} boss derrotado`}
                        </strong>
                      </div>
                    )}
                    <div className="avatar-preset-glow" style={{ background: preset.glow }} />
                  </motion.button>
                )
              })}
            </div>
          </div>

          <div className="avatar-lab-editor">
            <div className="avatar-preview-panel">
              <div className="avatar-preview-copy">
                <div className="sb-s-tag">Preview</div>
                <h2 className="font-display text-3xl font-extrabold mt-1">{profile?.username || 'Developer'}</h2>
                <p className="text-t2 mt-2">{selectedPreset.name} pronto para a campanha.</p>
              </div>
              <AvatarFigure
                presetId={selectedPreset.id}
                skin={selectedPreset.skin}
                hair={selectedPreset.hair}
                hat={profile?.avatar_hat}
                top={selectedPreset.outfit}
                shoes={profile?.avatar_shoes}
                size="lg"
                animated
                className="avatar-stage-preview"
              />
            </div>

            <div className="avatar-selected-summary">
              <div className="text-xs uppercase tracking-[.18em] text-t3 mb-2">Skin escolhida</div>
              <div className="avatar-selected-name">{selectedPreset.name}</div>
              <div className="avatar-selected-desc">
                {selectedPreset.subtitle} · {selectedPreset.rarity} · {getAvatarUnlockLabel(selectedPreset)}
              </div>
              <div className="avatar-selected-tags">
                <span>{selectedPreset.id}</span>
                <span>{selectedPreset.badge}</span>
                <span>{selectedPreset.tone}</span>
              </div>
            </div>

            <div className="avatar-action-bar">
              <button type="button" className="btn-secondary" onClick={() => router.push('/config')}>
                Voltar
              </button>
              <button type="button" className="btn-primary flex-1" onClick={save} disabled={loading || !unlocked}>
                {loading ? 'Salvando...' : unlocked ? 'Salvar avatar' : 'Bloqueado'}
              </button>
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  )
}
