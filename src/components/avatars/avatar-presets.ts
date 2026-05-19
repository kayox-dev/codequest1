export type AvatarHairStyle = 'short' | 'spiky' | 'long' | 'bob' | 'bun' | 'curly'
export type AvatarAccessory = 'none' | 'glasses' | 'headset' | 'beanie' | 'hood' | 'cap' | 'visor' | 'crown'
export type AvatarOutfit = 'hoodie' | 'jacket' | 'tee' | 'tech' | 'cyber' | 'casual' | 'armor'

export type AvatarPreset = {
  id: string
  name: string
  subtitle: string
  tone: 'masculino' | 'feminino' | 'neutro'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  unlockKind: 'level' | 'xp' | 'streak' | 'tracks' | 'lessons' | 'boss'
  unlockLevel: number
  unlockXp: number
  unlockValue: number
  skin: string
  hair: string
  hairStyle: AvatarHairStyle
  outfit: AvatarOutfit
  accent: string
  accent2: string
  accessory: AvatarAccessory
  shoes: string
  glow: string
  badge: string
}

export const avatarPresets: AvatarPreset[] = [

  {
    id: 'neo-hacker',
    name: 'Neo Hacker',
    subtitle: 'Cyber hoodie',
    tone: 'masculino',
    rarity: 'common',
    unlockKind: 'level',
    unlockLevel: 1,
    unlockXp: 0,
    unlockValue: 0,
    skin: '#f2c7a2',
    hair: '#1b1c24',
    hairStyle: 'spiky',
    outfit: 'cyber',
    accent: '#7c3fff',
    accent2: '#c4b5fd',
    accessory: 'glasses',
    shoes: '#101827',
    glow: 'rgba(124,63,255,.45)',
    badge: 'NX',
  },
  {
    id: 'pixel-artist',
    name: 'Pixel Artist',
    subtitle: 'Casual glow',
    tone: 'feminino',
    rarity: 'common',
    unlockKind: 'level',
    unlockLevel: 1,
    unlockXp: 0,
    unlockValue: 0,
    skin: '#e9c19b',
    hair: '#ff6b35',
    hairStyle: 'bob',
    outfit: 'casual',
    accent: '#ff6b35',
    accent2: '#ffd7be',
    accessory: 'none',
    shoes: '#332b55',
    glow: 'rgba(255,107,53,.35)',
    badge: 'PA',
  },
  {
    id: 'debug-rider',
    name: 'Debug Rider',
    subtitle: 'Street dev',
    tone: 'masculino',
    rarity: 'common',
    unlockKind: 'level',
    unlockLevel: 1,
    unlockXp: 0,
    unlockValue: 0,
    skin: '#d9a06c',
    hair: '#2b1f1f',
    hairStyle: 'short',
    outfit: 'jacket',
    accent: '#4dbbff',
    accent2: '#bde7ff',
    accessory: 'headset',
    shoes: '#0f172a',
    glow: 'rgba(77,187,255,.34)',
    badge: 'DR',
  },
  {
    id: 'glitch-dream',
    name: 'Glitch Dream',
    subtitle: 'Retro cyber',
    tone: 'feminino',
    rarity: 'common',
    unlockKind: 'level',
    unlockLevel: 1,
    unlockXp: 0,
    unlockValue: 0,
    skin: '#8b5e3c',
    hair: '#ec4899',
    hairStyle: 'long',
    outfit: 'tech',
    accent: '#ec4899',
    accent2: '#f9a8d4',
    accessory: 'visor',
    shoes: '#1f2937',
    glow: 'rgba(236,72,153,.3)',
    badge: 'GD',
  },
  {
    id: 'hood-scout',
    name: 'Hood Scout',
    subtitle: 'Warm hoodie',
    tone: 'masculino',
    rarity: 'common',
    unlockKind: 'level',
    unlockLevel: 1,
    unlockXp: 0,
    unlockValue: 0,
    skin: '#f4c7a1',
    hair: '#6e3cff',
    hairStyle: 'curly',
    outfit: 'hoodie',
    accent: '#7c3fff',
    accent2: '#d8b4fe',
    accessory: 'hood',
    shoes: '#111827',
    glow: 'rgba(124,63,255,.38)',
    badge: 'HS',
  },
  {
    id: 'night-bun',
    name: 'Night Bun',
    subtitle: 'Dark lounge',
    tone: 'feminino',
    rarity: 'common',
    unlockKind: 'level',
    unlockLevel: 1,
    unlockXp: 0,
    unlockValue: 0,
    skin: '#edd3b1',
    hair: '#111827',
    hairStyle: 'bun',
    outfit: 'hoodie',
    accent: '#9b6fff',
    accent2: '#f5d0fe',
    accessory: 'beanie',
    shoes: '#2a1f3d',
    glow: 'rgba(155,111,255,.32)',
    badge: 'NB',
  },
  {
    id: 'circuit-queen',
    name: 'Circuit Queen',
    subtitle: 'Rave jacket',
    tone: 'feminino',
    rarity: 'rare',
    unlockKind: 'tracks',
    unlockLevel: 3,
    unlockXp: 500,
    unlockValue: 1,
    skin: '#d9a06c',
    hair: '#f5a623',
    hairStyle: 'long',
    outfit: 'jacket',
    accent: '#f5a623',
    accent2: '#fde68a',
    accessory: 'headset',
    shoes: '#14141f',
    glow: 'rgba(245,166,35,.34)',
    badge: 'CQ',
  },
  {
    id: 'sandbox-pro',
    name: 'Sandbox Pro',
    subtitle: 'Block builder',
    tone: 'neutro',
    rarity: 'rare',
    unlockKind: 'lessons',
    unlockLevel: 3,
    unlockXp: 650,
    unlockValue: 12,
    skin: '#c58f62',
    hair: '#4b5563',
    hairStyle: 'short',
    outfit: 'armor',
    accent: '#2ecc71',
    accent2: '#bbf7d0',
    accessory: 'cap',
    shoes: '#202833',
    glow: 'rgba(46,204,113,.3)',
    badge: 'SP',
  },
  {
    id: 'sky-rogue',
    name: 'Sky Rogue',
    subtitle: 'Light future',
    tone: 'masculino',
    rarity: 'rare',
    unlockKind: 'streak',
    unlockLevel: 4,
    unlockXp: 850,
    unlockValue: 7,
    skin: '#f0c28d',
    hair: '#94a3b8',
    hairStyle: 'spiky',
    outfit: 'tech',
    accent: '#4dbbff',
    accent2: '#dbeafe',
    accessory: 'visor',
    shoes: '#0f172a',
    glow: 'rgba(77,187,255,.34)',
    badge: 'SR',
  },
  {
    id: 'dev-monk',
    name: 'Dev Monk',
    subtitle: 'Minimal mode',
    tone: 'masculino',
    rarity: 'epic',
    unlockKind: 'xp',
    unlockLevel: 6,
    unlockXp: 1200,
    unlockValue: 1200,
    skin: '#e7bf97',
    hair: '#1f2937',
    hairStyle: 'short',
    outfit: 'tee',
    accent: '#22c55e',
    accent2: '#bbf7d0',
    accessory: 'glasses',
    shoes: '#111827',
    glow: 'rgba(34,197,94,.22)',
    badge: 'DM',
  },
  {
    id: 'arcade-pilot',
    name: 'Arcade Pilot',
    subtitle: 'Retro headset',
    tone: 'feminino',
    rarity: 'epic',
    unlockKind: 'boss',
    unlockLevel: 7,
    unlockXp: 1500,
    unlockValue: 1,
    skin: '#d9a06c',
    hair: '#1b1c24',
    hairStyle: 'bob',
    outfit: 'cyber',
    accent: '#ff6b35',
    accent2: '#fdba74',
    accessory: 'headset',
    shoes: '#1e293b',
    glow: 'rgba(255,107,53,.3)',
    badge: 'AP',
  },
  {
    id: 'glass-operator',
    name: 'Glass Operator',
    subtitle: 'Clean dev',
    tone: 'neutro',
    rarity: 'legendary',
    unlockKind: 'level',
    unlockLevel: 8,
    unlockXp: 2000,
    unlockValue: 8,
    skin: '#f4c7a1',
    hair: '#312e81',
    hairStyle: 'short',
    outfit: 'casual',
    accent: '#9b6fff',
    accent2: '#e9d5ff',
    accessory: 'glasses',
    shoes: '#312e81',
    glow: 'rgba(155,111,255,.26)',
    badge: 'GO',
  },
  {
    id: 'ember-runner',
    name: 'Ember Runner',
    subtitle: 'Street heat',
    tone: 'feminino',
    rarity: 'legendary',
    unlockKind: 'streak',
    unlockLevel: 10,
    unlockXp: 3000,
    unlockValue: 14,
    skin: '#8b5e3c',
    hair: '#7c3fff',
    hairStyle: 'curly',
    outfit: 'jacket',
    accent: '#ef4444',
    accent2: '#fca5a5',
    accessory: 'beanie',
    shoes: '#1f2937',
    glow: 'rgba(239,68,68,.25)',
    badge: 'ER',
  },
  {
    id: 'boss-phantom',
    name: 'Boss Phantom',
    subtitle: 'Hidden raid skin',
    tone: 'neutro',
    rarity: 'legendary',
    unlockKind: 'boss',
    unlockLevel: 12,
    unlockXp: 3500,
    unlockValue: 2,
    skin: '#d9a06c',
    hair: '#111827',
    hairStyle: 'spiky',
    outfit: 'armor',
    accent: '#ef4444',
    accent2: '#fecaca',
    accessory: 'visor',
    shoes: '#111827',
    glow: 'rgba(239,68,68,.32)',
    badge: 'BP',
  },
  {
    id: 'final-warden',
    name: 'Final Warden',
    subtitle: 'Boss endgame',
    tone: 'masculino',
    rarity: 'legendary',
    unlockKind: 'boss',
    unlockLevel: 15,
    unlockXp: 5000,
    unlockValue: 3,
    skin: '#f4c7a1',
    hair: '#4b5563',
    hairStyle: 'curly',
    outfit: 'cyber',
    accent: '#22c55e',
    accent2: '#bbf7d0',
    accessory: 'crown',
    shoes: '#0f172a',
    glow: 'rgba(34,197,94,.28)',
    badge: 'FW',
  },
]

export const defaultAvatarPresetId = avatarPresets[0]?.id ?? 'neo-hacker'

export function getAvatarPreset(presetId?: string | null) {
  return avatarPresets.find((preset) => preset.id === presetId) ?? avatarPresets[0]
}

export function isAvatarPresetUnlocked(
  preset: AvatarPreset,
  stats: { level?: number; xp?: number; streak?: number; completedTracks?: number; completedLessons?: number; bossWins?: number } = {},
) {
  const level = stats.level ?? 1
  const xp = stats.xp ?? 0
  const streak = stats.streak ?? 0
  const completedTracks = stats.completedTracks ?? 0
  const completedLessons = stats.completedLessons ?? 0
  const bossWins = stats.bossWins ?? 0

  const valueOk =
    (preset.unlockKind === 'level' && level >= preset.unlockValue) ||
    (preset.unlockKind === 'xp' && xp >= preset.unlockValue) ||
    (preset.unlockKind === 'streak' && streak >= preset.unlockValue) ||
    (preset.unlockKind === 'tracks' && completedTracks >= preset.unlockValue) ||
    (preset.unlockKind === 'lessons' && completedLessons >= preset.unlockValue) ||
    (preset.unlockKind === 'boss' && bossWins >= preset.unlockValue)

  return level >= preset.unlockLevel || xp >= preset.unlockXp || valueOk
}

export function getAvatarUnlockLabel(preset: AvatarPreset) {
  const labelMap: Record<AvatarPreset['unlockKind'], string> = {
    level: `nível ${preset.unlockValue}`,
    xp: `${preset.unlockValue} XP`,
    streak: `${preset.unlockValue} dias de streak`,
    tracks: `${preset.unlockValue} trilha concluída`,
    lessons: `${preset.unlockValue} lições concluídas`,
    boss: `${preset.unlockValue} boss derrotado`,
  }

  return labelMap[preset.unlockKind]
}
