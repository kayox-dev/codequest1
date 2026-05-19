'use client'

import { motion } from 'framer-motion'
import type { CSSProperties } from 'react'
import { getAvatarPreset, type AvatarPreset } from '@/components/avatars/avatar-presets'

type AvatarParts = {
  skin?: string | null
  hair?: string | null
  hat?: string | null
  top?: string | null
  shoes?: string | null
  presetId?: string | null
}

const hatLabels: Record<string, string> = {
  none: '',
  cap: 'CAP',
  visor: 'VIS',
  hood: 'HOD',
  crown: 'CRW',
  bandana: 'BND',
  glasses: 'GLS',
  headset: 'HDS',
  beanie: 'BNI',
}

const hatColors: Record<string, string> = {
  none: 'transparent',
  cap: '#1e293b',
  visor: '#0f172a',
  hood: '#7c3fff',
  crown: '#f5a623',
  bandana: '#ef4444',
  glasses: '#4dbbff',
  headset: '#ec4899',
  beanie: '#f5a623',
}

const topBadges: Record<string, { badge: string; color: string; accent: string }> = {
  hoodie: { badge: 'HD', color: '#7c3fff', accent: '#c4b5fd' },
  jacket: { badge: 'JK', color: '#4dbbff', accent: '#bfdbfe' },
  armor: { badge: 'AR', color: '#94a3b8', accent: '#e2e8f0' },
  tee: { badge: 'TE', color: '#2ecc71', accent: '#bbf7d0' },
  tech: { badge: 'TX', color: '#f5a623', accent: '#fde68a' },
  neon: { badge: 'NX', color: '#ff6b35', accent: '#fed7aa' },
  cyber: { badge: 'CY', color: '#111827', accent: '#7c3fff' },
  casual: { badge: 'CL', color: '#334155', accent: '#e2e8f0' },
}

const shoesMap: Record<string, { badge: string; color: string }> = {
  sneakers: { badge: '👟', color: '#e5e7eb' },
  boots: { badge: '🥾', color: '#c08457' },
  hover: { badge: '🛸', color: '#4dbbff' },
  runners: { badge: '⚡', color: '#a855f7' },
}

export function AvatarFigure({
  skin,
  hair,
  hat,
  top,
  shoes,
  presetId,
  size = 'md',
  animated = false,
  pose = 'idle',
  emote = 'none',
  className = '',
}: AvatarParts & { size?: 'sm' | 'md' | 'lg'; animated?: boolean; pose?: 'idle' | 'walk' | 'victory'; emote?: 'none' | 'happy' | 'cool' | 'power'; className?: string }) {
  const preset = getAvatarPreset(presetId)
  const resolvedSkin = skin || preset.skin
  const resolvedHair = hair || preset.hair
  const resolvedHat = hat || 'none'
  const resolvedTop = (top || preset.outfit) as keyof typeof topBadges
  const resolvedShoes = (shoes || 'sneakers') as keyof typeof shoesMap

  const topStyle = topBadges[resolvedTop] || topBadges.hoodie
  const shoeStyle = shoesMap[resolvedShoes] || shoesMap.sneakers
  const hatColor = hatColors[resolvedHat] || hatColors.none
  const hatLabel = hatLabels[resolvedHat] || ''
  const presetRarity = preset.rarity
  const activeEmote = emote

  const baseMotion = animated
    ? pose === 'victory'
      ? { y: [0, -8, 0], rotate: [0, 1.4, 0, -1.1, 0], scale: [1, 1.04, 1] }
      : pose === 'walk'
        ? { x: [0, 3, 0, -3, 0], y: [0, -2, 0], rotate: [0, -1.2, 0, 1.2, 0] }
        : presetRarity === 'legendary'
          ? { y: [0, -6, 0], rotate: [0, 0.8, 0, -0.55, 0] }
          : presetRarity === 'epic'
            ? { y: [0, -5, 0], rotate: [0, 0.6, 0, -0.45, 0] }
            : { y: [0, -4, 0], rotate: [0, 0.55, 0, -0.35, 0] }
    : { y: 0, rotate: 0 }

  return (
    <motion.div
      className={`pixel-avatar pixel-avatar-${size} ${animated ? 'pixel-avatar-animated' : ''} ${pose === 'victory' ? 'pixel-avatar-victory' : ''} ${pose === 'walk' ? 'pixel-avatar-walk' : ''} rarity-${presetRarity} ${className}`.trim()}
      whileHover={{ scale: 1.03, y: -2 }}
      animate={baseMotion}
      transition={animated ? { duration: pose === 'victory' ? 1.5 : 3.2, repeat: animated && pose !== 'victory' ? Infinity : 0, ease: 'easeInOut' } : { duration: 0.2 }}
      style={
        {
          '--avatar-skin': resolvedSkin,
          '--avatar-hair': resolvedHair,
          '--avatar-top': topStyle.color,
          '--avatar-top-accent': topStyle.accent,
          '--avatar-shoes': shoeStyle.color,
          '--avatar-glow': preset.glow,
          '--avatar-accent': preset.accent,
        } as CSSProperties
      }
    >
      <div className="pixel-avatar-orb" />
      <div className="pixel-avatar-stage">
        <div className="pixel-avatar-shadow" />
        <div className="pixel-avatar-head">
          <div className={`pixel-avatar-hair hair-${preset.hairStyle}`} />
          {resolvedHat !== 'none' && (
            <div className={`pixel-avatar-hat hat-${resolvedHat}`}>
              <span style={{ color: hatColor }}>{hatLabel}</span>
            </div>
          )}
          <div className="pixel-avatar-face">
            <span className="eye eye-left" />
            <span className="eye eye-right" />
            <span className="mouth" />
          </div>
          {activeEmote !== 'none' && (
            <div className={`pixel-avatar-emote emote-${activeEmote}`}>
              {activeEmote === 'happy' ? ':)' : activeEmote === 'cool' ? '8)' : '!' }
            </div>
          )}
        </div>
        <div className="pixel-avatar-neck" />
        <div className="pixel-avatar-upper">
          <div className="pixel-avatar-arm arm-left" />
          <div className={`pixel-avatar-torso outfit-${resolvedTop}`}>
            <div className="pixel-avatar-badge">{topStyle.badge}</div>
          </div>
          <div className="pixel-avatar-arm arm-right" />
        </div>
        <div className="pixel-avatar-legs">
          <span className="pixel-avatar-leg" />
          <span className="pixel-avatar-leg" />
        </div>
        <div className="pixel-avatar-shoes">
          <span style={{ color: shoeStyle.color }}>{shoeStyle.badge}</span>
          <span style={{ color: shoeStyle.color }}>{shoeStyle.badge}</span>
        </div>
      </div>
    </motion.div>
  )
}
