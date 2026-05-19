'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { useAppStore } from '@/store'
import { AvatarFigure } from '@/components/shared/AvatarFigure'
import { supabase } from '@/lib/supabase'
import { getEquippedPlayerTag } from '@/lib/player-tags'

type ProfileMeta = {
  achievements: number
  rankPosition: number | null
  trackProgress: number
}

export default function Perfil() {
  const { profile } = useAppStore()
  const username = profile?.username || 'Dev'
  const equippedTag = getEquippedPlayerTag(profile)
  const [meta, setMeta] = useState<ProfileMeta>({ achievements: 0, rankPosition: null, trackProgress: 0 })

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      const user = data.user
      if (!user) return

      const [{ data: rankedProfiles }, { data: progress }] = await Promise.all([
        supabase.from('rankings').select('user_id').order('xp_total', { ascending: false }),
        profile?.selected_track_id
          ? supabase
              .from('user_track_progress')
              .select('progress_percent')
              .eq('user_id', user.id)
              .eq('track_id', profile.selected_track_id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ])

      const rankPosition = rankedProfiles?.findIndex((item) => item.user_id === user.id)

      setMeta({
        achievements: 0,
        rankPosition: rankPosition != null && rankPosition >= 0 ? rankPosition + 1 : null,
        trackProgress: progress?.progress_percent ?? 0,
      })
    })()
  }, [profile?.selected_track_id])

  return (
    <AppShell>
      <main className="perfil-main">
        <div className="perfil-hero">
          <AvatarFigure
            size="lg"
            presetId={profile?.avatar_preset}
            skin={profile?.avatar_skin}
            hair={profile?.avatar_hair}
            hat={profile?.avatar_hat}
            top={profile?.avatar_top}
            shoes={profile?.avatar_shoes}
            animated
          />
          <div style={{ flex: 1 }}>
            <div className="perfil-name">{username}</div>
            {equippedTag ? (
              <div className={`player-title-badge profile-title-badge rarity-${equippedTag.rarity}`}>
                <span>{equippedTag.icon}</span>
                {equippedTag.name}
              </div>
            ) : (
              <div className="perfil-title">Nenhuma tag equipada</div>
            )}
            <div className="perfil-stats-row">
              <Stat value={profile?.streak ?? 0} label="Streak" color="var(--gold)" />
              <Stat value={profile?.xp_total ?? 0} label="XP Total" color="var(--gem)" />
              <Stat value={profile?.level ?? 1} label="Nível" color="var(--accent2)" />
              <Stat value={meta.achievements} label="Conquistas" color="var(--green)" />
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link className="btn-primary" href="/config/avatar">
                Trocar avatar
              </Link>
              <Link className="btn-secondary" href="/config">
                Configurações
              </Link>
              <Link className="btn-secondary" href="/config/tags">
                Trocar tag
              </Link>
            </div>
          </div>
        </div>

        <div className="perfil-grid">
          <Info icon="📚" value={profile?.favorite_languages?.length ?? 0} label="Linguagens favoritas" />
          <Info icon="⚡" value={profile?.daily_minutes ?? 30} label="Minutos por dia" />
          <Info icon="🎯" value={profile?.skill_level || 'iniciante'} label="Nível atual" />
          <Info icon="⏱" value="0h" label="Horas registradas" />
          <Info icon="🏆" value={meta.rankPosition ? `#${meta.rankPosition}` : '—'} label="Ranking global" />
          <Info icon="🌿" value={`${meta.trackProgress}%`} label="Progresso da trilha" />
        </div>

        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 18 }}>
          <div className="sec-title" style={{ marginBottom: 14 }}>
            Skills favoritas
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {profile?.favorite_languages?.length ? (
              profile.favorite_languages.map((lang) => <Tag key={lang} icon="✨" label={lang} />)
            ) : (
              <span className="text-t3 text-sm">Nenhuma skill escolhida ainda.</span>
            )}
          </div>
        </div>
      </main>
    </AppShell>
  )
}

function Stat({ value, label, color }: { value: any; label: string; color: string }) {
  return (
    <div className="ps-stat">
      <div className="ps-val" style={{ color }}>
        {value}
      </div>
      <div className="ps-lbl">{label}</div>
    </div>
  )
}

function Info({ icon, value, label }: { icon: string; value: any; label: string }) {
  return (
    <div className="ps-card">
      <div className="ps-card-icon">{icon}</div>
      <div className="ps-card-val">{value}</div>
      <div className="ps-card-lbl">{label}</div>
    </div>
  )
}

function Tag({ icon, label }: { icon: string; label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'var(--accent-dim)',
        border: '1px solid var(--border2)',
        borderRadius: 'var(--rpill)',
        padding: '5px 13px',
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--accent2)',
      }}
    >
      {icon} {label}
    </div>
  )
}
