'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { profileService } from '@/services/auth.service'
import { useAppStore } from '@/store'
import { AvatarFigure } from '@/components/shared/AvatarFigure'
import { avatarPresets, getAvatarPreset, isAvatarPresetUnlocked, type AvatarAccessory } from '@/components/avatars/avatar-presets'



const avatarSkins = ['#F4C7A1', '#D9A06C', '#8B5E3C', '#5C3B2E', '#EDD3B1']
const avatarHairs = ['#6E3CFF', '#FF6B35', '#1ABC9C', '#F5A623', '#22223b', '#ec4899']
const avatarTops = ['hoodie', 'jacket', 'armor', 'tee', 'tech', 'neon', 'cyber', 'casual'] as const
const avatarShoes = ['sneakers', 'boots', 'hover', 'runners'] as const

type Draft = {
  username: string
  skill: string
  goal: string
  languages: string[]
  minutes: number
}

export default function AvatarCreator() {
  const router = useRouter()
  const { updateProfile } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [selectedPresetId, setSelectedPresetId] = useState(avatarPresets[0]?.id ?? 'neo-hacker')
  const [avatarSkin, setAvatarSkin] = useState(avatarSkins[0])
  const [avatarHair, setAvatarHair] = useState(avatarHairs[0])
  const [avatarHat, setAvatarHat] = useState<AvatarAccessory>('none')
  const [avatarTop, setAvatarTop] = useState<(typeof avatarTops)[number]>('hoodie')
  const [avatarShoesStyle, setAvatarShoesStyle] = useState<(typeof avatarShoes)[number]>('sneakers')
  const initialPresets = useMemo(() => avatarPresets.filter((preset) => isAvatarPresetUnlocked(preset)), [])

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      const user = data.user
      if (!user) {
        router.push('/auth/login')
        return
      }

      const raw = sessionStorage.getItem('cq_onboarding_draft')
      if (!raw) {
        router.push('/onboarding')
        return
      }

      try {
        const nextDraft = JSON.parse(raw) as Draft
        setDraft(nextDraft)
      } catch {
        router.push('/onboarding')
      }
    })()
  }, [router])

  useEffect(() => {
    if (!draft) return
    const preset = getAvatarPreset(selectedPresetId)
    setAvatarSkin(preset.skin)
    setAvatarHair(preset.hair)
    setAvatarHat('none')
    setAvatarTop(preset.outfit as (typeof avatarTops)[number])
    setAvatarShoesStyle('sneakers')
  }, [draft, selectedPresetId])

  const selectedPreset = useMemo(() => getAvatarPreset(selectedPresetId), [selectedPresetId])

  async function finish() {
    if (!draft) return
    if (!selectedPresetId) {
      toast.error('Selecione um avatar antes de continuar.')
      return
    }

    setLoading(true)
    const selectedAvatar = {
      avatar_url: null,
      avatar_preset: selectedPresetId,
      avatar_skin: avatarSkin,
      avatar_hair: avatarHair,
      avatar_hat: avatarHat,
      avatar_top: avatarTop,
      avatar_shoes: avatarShoesStyle,
    }

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()
      const user = session?.user

      console.log('[Avatar onboarding] save start', {
        hasSession: Boolean(session),
        sessionError,
        userId: user?.id,
        selectedAvatar,
      })

      if (sessionError) {
        console.error('[Avatar onboarding] session error', sessionError)
        throw sessionError
      }

      if (!user?.id) {
        sessionStorage.setItem('cq_pending_avatar', JSON.stringify({ draft, selectedAvatar }))
        toast.error('Sua sessão expirou. Entre novamente para salvar o avatar.')
        router.push('/auth/login')
        return
      }

      const profile = await profileService.completeOnboarding(user.id, {
        username: draft.username,
        ...selectedAvatar,
        skill_level: draft.skill,
        goal: draft.goal,
        favorite_languages: draft.languages,
        daily_minutes: draft.minutes,
      })

      console.log('[Avatar onboarding] upsert success', {
        userId: user.id,
        selectedAvatar,
        profile,
      })

      if (!profile) {
        console.error('[Avatar onboarding] empty profile response after upsert', {
          userId: user.id,
          selectedAvatar,
        })
        toast.error('Não consegui salvar seu avatar. Veja o console para o erro real.')
        return
      }

      sessionStorage.removeItem('cq_onboarding_draft')
      sessionStorage.removeItem('cq_pending_avatar')
      updateProfile(profile)
      toast.success('Avatar criado')
      router.push('/intro')
    } catch (error) {
      console.error('[Avatar onboarding] save failed', {
        selectedAvatar,
        error,
      })
      toast.error('Houve um erro ao salvar o avatar. Veja o console para o erro real.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-shell bg-grid onboarding-shell">
      <section className="profile-creator avatar-lab">
        <div className="onboarding-hero">
          <div>
            <div className="sb-s-tag">Oficina do avatar</div>
            <h1 className="font-display text-4xl font-extrabold mt-1">Escolha seu personagem jogável</h1>
            <p className="text-t2 mt-2 max-w-2xl avatar-lab-intro">
              Escolha um modelo inicial e ajuste os detalhes principais antes de entrar na campanha.
            </p>
          </div>
          <div className="onboarding-hero-badge">
            <div className="text-3xl">🎮</div>
            <div>
              <div className="text-[10px] uppercase tracking-[.18em] text-t3">Etapa atual</div>
              <div className="font-display text-lg font-extrabold">Avatar Lab</div>
            </div>
          </div>
        </div>

        <div className="wizard-progress">
          <div className="wizard-dot done">1</div>
          <div className="wizard-line done" />
          <div className="wizard-dot active">2</div>
        </div>

        <div className="avatar-lab-layout">
          <div className="avatar-lab-gallery">
            <div className="avatar-lab-header">
              <div>
                <div className="text-xs uppercase tracking-[.18em] text-t3">Galeria de avatares</div>
                <div className="font-display text-2xl font-extrabold mt-1 avatar-lab-title">Escolha sua skin inicial</div>
              </div>
              <div className="avatar-lab-count">{initialPresets.length} iniciais</div>
            </div>

            <div className="avatar-preset-grid" role="radiogroup" aria-label="Avatares iniciais">
              {initialPresets.map((preset) => {

                const selected = preset.id === selectedPresetId
                return (

                  <motion.button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedPresetId(preset.id)}
                    className={`avatar-preset-card ${selected ? 'active' : ''}`}
                    aria-pressed={selected}
                    aria-label={`Selecionar avatar ${preset.name}, ${preset.subtitle}`}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="avatar-preset-stage">
                      <AvatarFigure presetId={preset.id} size="sm" animated={false} className="avatar-preset-figure" />
                    </div>
                    <div className="avatar-preset-meta">
                      <div className="avatar-preset-name">{preset.name}</div>
                      <div className="avatar-preset-sub">{preset.subtitle}</div>
                    </div>
                    {selected && <div className="avatar-preset-selected" aria-hidden="true">Selecionado</div>}
                    <div className="avatar-preset-tags">
                      <span>{preset.tone}</span>
                      <span>{preset.badge}</span>
                    </div>
                    <div className="avatar-preset-glow" style={{ background: preset.glow }} />
                  </motion.button>
                )
              })}
            </div>
          </div>

          <div className="avatar-lab-editor">
            <div className="avatar-preview-panel">
              <div className="avatar-preview-copy">
                <div className="sb-s-tag">Preview ativo</div>
                <h2 className="font-display text-3xl font-extrabold mt-1">{draft?.username || 'developer'}</h2>
                <p className="text-t2 mt-2">{selectedPreset.name} pronto para entrar na campanha.</p>
              </div>
              <AvatarFigure
                presetId={selectedPreset.id}
                skin={avatarSkin}
                hair={avatarHair}
                hat={avatarHat}
                top={avatarTop}
                shoes={avatarShoesStyle}
                size="lg"
                animated
                className="avatar-stage-preview"
              />
            </div>

            <div className="avatar-detail-grid">
              <CompactGroup title="Tom de pele">
                <div className="flex flex-wrap gap-2">
                  {avatarSkins.map((x, index) => (
                    <button key={x} type="button" aria-label={`Tom de pele ${index + 1}`} aria-pressed={avatarSkin === x} onClick={() => setAvatarSkin(x)} className={`avatar-chip ${avatarSkin === x ? 'active' : ''}`} style={{ background: x }} />
                  ))}
                </div>
              </CompactGroup>

              <CompactGroup title="Cabelo">
                <div className="flex flex-wrap gap-2">
                  {avatarHairs.map((x, index) => (
                    <button key={x} type="button" aria-label={`Cor de cabelo ${index + 1}`} aria-pressed={avatarHair === x} onClick={() => setAvatarHair(x)} className={`avatar-chip ${avatarHair === x ? 'active' : ''}`} style={{ background: x }} />
                  ))}
                </div>
              </CompactGroup>

              <CompactGroup title="Acessório">
                <div className="flex flex-wrap gap-2">
                  {(['none', 'glasses', 'headset', 'beanie', 'hood', 'cap', 'visor'] as AvatarAccessory[]).map((x) => (
                    <button key={x} type="button" aria-pressed={avatarHat === x} onClick={() => setAvatarHat(x)} className={`btn-secondary ${avatarHat === x ? 'avatar-option-active' : ''}`}>
                      {x === 'none' ? 'Sem' : x}
                    </button>
                  ))}
                </div>
              </CompactGroup>

              <CompactGroup title="Roupa">
                <div className="flex flex-wrap gap-2">
                  {avatarTops.map((x) => (
                    <button key={x} type="button" aria-pressed={avatarTop === x} onClick={() => setAvatarTop(x)} className={`btn-secondary ${avatarTop === x ? 'avatar-option-active' : ''}`}>
                      {x}
                    </button>
                  ))}
                </div>
              </CompactGroup>

              <CompactGroup title="Sapato">
                <div className="flex flex-wrap gap-2">
                  {avatarShoes.map((x) => (
                    <button key={x} type="button" aria-pressed={avatarShoesStyle === x} onClick={() => setAvatarShoesStyle(x)} className={`btn-secondary ${avatarShoesStyle === x ? 'avatar-option-active' : ''}`}>
                      {x}
                    </button>
                  ))}
                </div>
              </CompactGroup>

              <div className="avatar-selected-summary">
                <div className="text-xs uppercase tracking-[.18em] text-t3 mb-2">Skin escolhida</div>
                <div className="avatar-selected-name">{selectedPreset.name}</div>
                <div className="avatar-selected-desc">{selectedPreset.subtitle}</div>
                <div className="avatar-selected-tags">
                  <span>{selectedPreset.tone}</span>
                  <span>{selectedPreset.badge}</span>
                  <span>{selectedPreset.id}</span>
                </div>
              </div>
            </div>

            <div className="avatar-action-bar">
              <button type="button" className="btn-secondary" onClick={() => router.push('/onboarding')}>
                Voltar
              </button>
              <button type="button" className="btn-primary flex-1" onClick={finish} disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar avatar e começar'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function CompactGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="avatar-control-card">
      <div className="text-xs uppercase tracking-[.18em] text-t3 mb-2">{title}</div>
      {children}
    </div>
  )
}
