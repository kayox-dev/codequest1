'use client'

import Link from 'next/link'
import {
  Badge,
  BarChart3,
  Crown,
  Gauge,
  Medal,
  MoreHorizontal,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  User,
  X,
} from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { AiAssistant } from '@/components/shared/AiAssistant'
import { AvatarFigure } from '@/components/shared/AvatarFigure'
import { getEquippedPlayerTag } from '@/lib/player-tags'
import { supabase } from '@/lib/supabase'
import { authService, profileService } from '@/services/auth.service'
import { trackService } from '@/services/track.service'
import { useAppStore } from '@/store'

type NavItem = {
  href: string
  icon: React.ElementType
  label: string
  mobilePrimary?: boolean
  mobileMore?: boolean
}

const nav: NavItem[] = [
  { href: '/dashboard', icon: Gauge, label: 'Dashboard', mobilePrimary: true },
  { href: '__TRACK__', icon: BarChart3, label: 'Trilhas', mobilePrimary: true },
  { href: '/desafios', icon: Sparkles, label: 'Desafios', mobileMore: true },
  { href: '/missoes', icon: Target, label: 'Missões', mobilePrimary: true },
  { href: '/ranking', icon: Trophy, label: 'Ranking', mobileMore: true },
  { href: '/skill-tree', icon: Crown, label: 'Skill Tree', mobileMore: true },
  { href: '/config/tags', icon: Badge, label: 'Tags', mobileMore: true },
  { href: '/conquistas', icon: Medal, label: 'Conquistas', mobileMore: true },
  { href: '/perfil', icon: User, label: 'Perfil', mobilePrimary: true },
  { href: '/config', icon: Settings, label: 'Configurações', mobileMore: true },
  { href: '/admin', icon: ShieldCheck, label: 'Admin', mobileMore: true },
]

export function AppShell({
  children,
  rightPanel,
}: {
  children: React.ReactNode
  rightPanel?: React.ReactNode
}) {
  const path = usePathname()
  const router = useRouter()
  const { profile, currentTrack, setProfile, setCurrentTrack, toggleAi } = useAppStore()
  const [trackHref, setTrackHref] = useState('/escolha-trilha')
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false)

  useEffect(() => {
    let active = true

    ;(async () => {
      const { data } = await supabase.auth.getUser()
      if (!active || !data.user) return

      const freshProfile = await profileService.getProfile(data.user.id)
      if (!active) return

      setProfile(freshProfile)

      if (!freshProfile?.selected_track_id) {
        setCurrentTrack(null, null)
        setTrackHref('/escolha-trilha')
        return
      }

      const selected = await trackService.getTrackById(freshProfile.selected_track_id)
      if (!active) return

      const progress = selected ? await trackService.getTrackProgress(data.user.id, selected.id) : null
      if (!active) return

      setCurrentTrack(selected, progress)
      setTrackHref(selected ? `/trilhas/${selected.slug}` : '/escolha-trilha')
    })().catch((error) => {
      console.error('[AppShell] route data sync failed', { path, error })
    })

    return () => {
      active = false
    }
  }, [path, setProfile, setCurrentTrack])

  useEffect(() => {
    let active = true

    ;(async () => {
      if (currentTrack?.id === profile?.selected_track_id) {
        setTrackHref(`/trilhas/${currentTrack.slug}`)
        return
      }

      if (!profile?.selected_track_id) {
        setTrackHref('/escolha-trilha')
        return
      }

      const selected = await trackService.getTrackById(profile.selected_track_id)
      if (!active) return

      setCurrentTrack(selected)
      setTrackHref(selected ? `/trilhas/${selected.slug}` : '/escolha-trilha')
    })().catch(() => {
      if (active) setTrackHref('/escolha-trilha')
    })

    return () => {
      active = false
    }
  }, [currentTrack, profile?.selected_track_id, setCurrentTrack])

  const resolvedNav = useMemo(
    () => nav.map((item) => ({ ...item, href: item.href === '__TRACK__' ? trackHref : item.href })),
    [trackHref],
  )
  const mobileNav = useMemo(
    () => resolvedNav.filter((item) => item.mobilePrimary),
    [resolvedNav],
  )
  const mobileMoreNav = useMemo(
    () => resolvedNav.filter((item) => item.mobileMore),
    [resolvedNav],
  )
  const isActiveNavItem = (href: string, label: string) =>
    label === 'Trilhas'
      ? path === href || path.startsWith('/trilhas')
      : href === '/config'
        ? path === '/config' || path.startsWith('/config/avatar')
        : path === href || path.startsWith(`${href}/`)
  const mobileMoreActive = mobileMoreNav.some(({ href, label }) => isActiveNavItem(href, label))
  const equippedTag = getEquippedPlayerTag(profile)

  useEffect(() => {
    setMobileMoreOpen(false)
  }, [path])

  useEffect(() => {
    if (!mobileMoreOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMoreOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mobileMoreOpen])

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/dashboard" className="logo" aria-label="Ir para o dashboard da CodeQuest">
          <div className="logo-box">🎮</div>
          <span className="logo-text">CodeQuest</span>
        </Link>
        <nav className="nav" aria-label="Navegação principal">
          {resolvedNav.map(({ href, icon: Icon, label }) => {
            const active = isActiveNavItem(href, label)

            return (
              <Link key={`${label}-${href}`} href={href} className={`nav-item ${active ? 'active' : ''}`} aria-current={active ? 'page' : undefined}>
                <Icon className="ni" aria-hidden="true" size={17} strokeWidth={2.25} />
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="sb-season">
          <div className="sb-s-tag">Temporada 1</div>
          <div className="sb-s-title">Frontend Warrior</div>
          <div className="sb-s-timer">Progresso real</div>
          <div className="sb-s-icon">⚔️</div>
          <div className="xpbar">
            <div className="xpfill" style={{ width: `${Math.min((profile?.level ?? 1) * 2, 45)}%` }} />
          </div>
        </div>
        <button onClick={toggleAi} className="btn-secondary mx-3 mb-3 jarvis-button" aria-label="Abrir assistente Jarvis">
          🤖 IA Jarvis
        </button>
      </aside>

      <div className="wrap">
        <header className="topbar">
          <Chip icon="🔥" v={profile?.streak ?? 0} l="Streak" />
          <Chip icon="⚡" v={profile?.xp_total ?? 0} l="XP Total" />
          <div className="tb-gap" />
          <button onClick={toggleAi} className="btn-secondary hidden md:inline-flex jarvis-button" aria-label="Abrir assistente Jarvis">
            IA
          </button>
          <div className="user-pill">
            <AvatarFigure
              size="sm"
              presetId={profile?.avatar_preset}
              skin={profile?.avatar_skin}
              hair={profile?.avatar_hair}
              hat={profile?.avatar_hat}
              top={profile?.avatar_top}
              shoes={profile?.avatar_shoes}
              className="user-avatar-figure"
            />
            <div>
              <div className="user-name">{profile?.username || 'Developer'}</div>
              <div className="user-lvl">{equippedTag ? `${equippedTag.icon} ${equippedTag.name}` : `Nível ${profile?.level ?? 1}`}</div>
            </div>
            <span style={{ color: 'var(--t3)', fontSize: 12 }}>▾</span>
          </div>
          <button
            onClick={async () => {
              await authService.signOut()
              router.push('/')
            }}
            className="text-t3 text-xs hover:text-white"
            aria-label="Sair da conta"
          >
            Sair
          </button>
        </header>

        <div className="content-area">
          {children}
          {rightPanel && <aside className="right-panel">{rightPanel}</aside>}
        </div>
      </div>

      <div
        className={`mobile-more-backdrop ${mobileMoreOpen ? 'open' : ''}`}
        aria-hidden="true"
        onClick={() => setMobileMoreOpen(false)}
      />
      <aside
        id="mobile-more-menu"
        className={`mobile-more-drawer ${mobileMoreOpen ? 'open' : ''}`}
        aria-label="Mais áreas da plataforma"
        aria-hidden={!mobileMoreOpen}
        inert={!mobileMoreOpen ? true : undefined}
      >
        <div className="mobile-more-head">
          <div>
            <span>CodeQuest</span>
            <strong>Mais áreas</strong>
          </div>
          <button type="button" className="mobile-more-close" aria-label="Fechar menu Mais" onClick={() => setMobileMoreOpen(false)}>
            <X size={19} aria-hidden="true" />
          </button>
        </div>
        <nav className="mobile-more-list" aria-label="Áreas adicionais mobile">
          {mobileMoreNav.map(({ href, icon: Icon, label }) => {
            const active = isActiveNavItem(href, label)

            return (
              <Link
                key={`mobile-more-${label}-${href}`}
                href={href}
                className={`mobile-more-item ${active ? 'active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <span className="mobile-more-icon" aria-hidden="true">
                  <Icon size={19} strokeWidth={2.2} />
                </span>
                <strong>{label}</strong>
              </Link>
            )
          })}
        </nav>
      </aside>

      <nav className="mobile-bottom-nav" aria-label="Navegação principal mobile">
        {mobileNav.map(({ href, icon: Icon, label }) => {
          const active = isActiveNavItem(href, label)

          return (
            <Link key={`mobile-${label}-${href}`} href={href} className={`mobile-nav-item ${active ? 'active' : ''}`} aria-current={active ? 'page' : undefined}>
              <Icon aria-hidden="true" size={20} strokeWidth={2.25} />
              <strong>{label}</strong>
            </Link>
          )
        })}
        <button
          type="button"
          className={`mobile-nav-item mobile-more-trigger ${mobileMoreActive || mobileMoreOpen ? 'active' : ''}`}
          aria-label="Abrir mais áreas da plataforma"
          aria-expanded={mobileMoreOpen}
          aria-controls="mobile-more-menu"
          onClick={() => setMobileMoreOpen((open) => !open)}
        >
          <MoreHorizontal aria-hidden="true" size={22} strokeWidth={2.4} />
          <strong>Mais</strong>
        </button>
      </nav>

      <AiAssistant />
    </div>
  )
}

function Chip({ icon, v, l }: { icon: string; v: any; l: string }) {
  const color = l === 'Streak' ? 'var(--gold)' : 'var(--gem)'

  return (
    <div className="chip" aria-label={`${l}: ${v}`}>
      <span aria-hidden="true">{icon}</span>
      <span style={{ color }}>{v}</span>
      <span className="chip-lbl">{l}</span>
    </div>
  )
}
