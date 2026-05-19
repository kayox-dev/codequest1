'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Lock, Sparkles, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { AppShell } from '@/components/layout/AppShell'
import { supabase } from '@/lib/supabase'
import { getEquippedPlayerTag, getPlayerTag, getTagProgress, mergeUnlockedTags, PLAYER_TAGS } from '@/lib/player-tags'
import { getProgressionMetrics, percent, type ProgressionMetrics } from '@/services/progression.service'
import { profileService } from '@/services/auth.service'
import { useAppStore } from '@/store'

export default function ConfigTags() {
  const { profile, updateProfile } = useAppStore()
  const [metrics, setMetrics] = useState<ProgressionMetrics | null>(null)
  const [savingSlug, setSavingSlug] = useState<string | null>(null)
  const [previewSlug, setPreviewSlug] = useState<string | null>(profile?.equipped_tag ?? null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setPreviewSlug(profile?.equipped_tag ?? null)
  }, [profile?.equipped_tag])

  useEffect(() => {
    let active = true

    ;(async () => {
      try {
        setLoading(true)
        const { data } = await supabase.auth.getUser()
        if (!data.user) return

        const nextMetrics = await getProgressionMetrics(data.user.id, profile)
        if (!active) return
        setMetrics(nextMetrics)

        const unlocked = mergeUnlockedTags(nextMetrics.profile ?? profile, nextMetrics)
        const current = nextMetrics.profile?.unlocked_tags ?? profile?.unlocked_tags ?? []
        const changed = unlocked.length !== current.length || unlocked.some((slug) => !current.includes(slug))

        if (changed) {
          const nextProfile = await profileService.updateProfile(data.user.id, { unlocked_tags: unlocked })
          if (!active) return
          updateProfile(nextProfile)
        }
      } catch (err: any) {
        console.error('[ConfigTags] failed to load tags', err)
        setError(err?.message ?? 'Não consegui carregar suas tags.')
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [profile, updateProfile])

  const unlockedTags = useMemo(() => mergeUnlockedTags(profile, metrics), [profile, metrics])
  const equippedTag = getEquippedPlayerTag(profile)
  const previewTag = getPlayerTag(previewSlug) ?? equippedTag

  async function saveEquippedTag(slug: string | null) {
    const { data } = await supabase.auth.getUser()
    if (!data.user) return

    if (slug && !unlockedTags.includes(slug)) {
      toast.error('Essa tag ainda esta bloqueada.')
      return
    }

    setSavingSlug(slug ?? 'remove')
    try {
      const nextProfile = await profileService.updateProfile(data.user.id, { equipped_tag: slug, unlocked_tags: unlockedTags })
      updateProfile(nextProfile)
      setPreviewSlug(slug)
      toast.success(slug ? 'Tag equipada' : 'Tag desequipada')
    } catch (err: any) {
      console.error('[ConfigTags] failed to save tag', err)
      toast.error(err?.message ?? 'Não consegui salvar essa tag.')
    } finally {
      setSavingSlug(null)
    }
  }

  return (
    <AppShell>
      <main className="devtags-main config-tags-main">
        <div className="progression-head">
          <div>
            <div className="sec-title">Configurações / Tags</div>
            <p className="text-t2 text-sm">Escolha um titulo principal para aparecer no perfil, ranking e dashboard.</p>
          </div>
          <div className="progression-summary">
            <span>{unlockedTags.length}/{PLAYER_TAGS.length} liberadas</span>
            <span>{profile?.equipped_tag ? '1 equipada' : '0 equipada'}</span>
          </div>
        </div>

        <section className="tag-preview-panel">
          <div>
            <div className="tag-preview-kicker">Preview do perfil</div>
            <div className="tag-preview-name">{profile?.username || 'Developer'}</div>
            {previewTag ? (
              <div className={`player-title-badge rarity-${previewTag.rarity}`}>
                <span>{previewTag.icon}</span>
                {previewTag.name}
              </div>
            ) : (
              <div className="player-title-empty">Nenhuma tag equipada</div>
            )}
          </div>
          <button type="button" className="btn-secondary tag-remove-btn" onClick={() => saveEquippedTag(null)} disabled={!profile?.equipped_tag || savingSlug !== null}>
            <X size={15} />
            Desequipar
          </button>
        </section>

        {error && <div className="mission-feedback error">{error}</div>}
        {loading && <div className="mission-feedback idle">Atualizando tags desbloqueadas...</div>}

        <div className="tags-grid equip-tags-grid">
          {PLAYER_TAGS.map((tag, index) => {
            const unlocked = unlockedTags.includes(tag.slug)
            const equipped = profile?.equipped_tag === tag.slug
            const current = getTagProgress(tag, metrics)

            return (
              <button
                type="button"
                className={`tag-card equip-tag-card rarity-${tag.rarity} ${unlocked ? 'owned' : 'locked'} ${equipped ? 'equipped' : ''}`}
                key={tag.slug}
                onMouseEnter={() => unlocked && setPreviewSlug(tag.slug)}
                onFocus={() => unlocked && setPreviewSlug(tag.slug)}
                onClick={() => unlocked && setPreviewSlug(tag.slug)}
                style={{ transitionDelay: `${index * 12}ms` }}
              >
                <div className="equip-tag-top">
                  <div className="tag-icon">{tag.icon}</div>
                  <div className="tag-lock">{unlocked ? equipped ? <Check size={16} /> : <Sparkles size={16} /> : <Lock size={16} />}</div>
                </div>
                <div className="tag-name">{tag.name}</div>
                <div className="tag-meta-row">
                  <span>{tag.rarity}</span>
                  <span>{tag.category}</span>
                </div>
                <div className="tag-desc">{tag.description}</div>
                <div className={`tag-status ${unlocked ? 'owned' : 'locked'}`}>
                  {unlocked ? (equipped ? 'Equipada agora' : 'Disponivel para equipar') : `${current}/${tag.required}`}
                </div>
                <div className="achievement-progress">
                  <div style={{ width: `${unlocked ? 100 : percent(current, tag.required)}%` }} />
                </div>
                <div className="tag-actions">
                  {equipped ? (
                    <span className="tag-equipped-chip">Ativa</span>
                  ) : unlocked ? (
                    <span
                      className="btn-primary tag-equip-btn"
                      onClick={(event) => {
                        event.stopPropagation()
                        saveEquippedTag(tag.slug)
                      }}
                    >
                      {savingSlug === tag.slug ? 'Salvando...' : 'Equipar'}
                    </span>
                  ) : (
                    <span className="tag-locked-chip">Bloqueada</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </main>
    </AppShell>
  )
}
