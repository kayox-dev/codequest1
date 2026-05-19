import type { ProgressionMetrics } from '@/services/progression.service'
import type { Profile } from '@/types'

export type PlayerTagRarity = 'common' | 'rare' | 'epic' | 'legendary'
export type PlayerTagCategory = 'Frontend' | 'Debug' | 'Framework' | 'Backend' | 'Security' | 'AI' | 'Rank' | 'Streak'

export type PlayerTag = {
  slug: string
  name: string
  icon: string
  rarity: PlayerTagRarity
  category: PlayerTagCategory
  description: string
  metric: keyof Pick<ProgressionMetrics, 'completedLessons' | 'completedTracks' | 'xp' | 'level' | 'streak' | 'challengesCompleted'>
  required: number
}

export const PLAYER_TAGS: PlayerTag[] = [
  {
    slug: 'frontend-warrior',
    name: 'Frontend Warrior',
    icon: '🔥',
    rarity: 'rare',
    category: 'Frontend',
    description: 'Dominou as primeiras missões de interface e estrutura web.',
    metric: 'completedLessons',
    required: 6,
  },
  {
    slug: 'bug-hunter',
    name: 'Bug Hunter',
    icon: '🐞',
    rarity: 'rare',
    category: 'Debug',
    description: 'Resolveu desafios e mostrou faro para corrigir problemas.',
    metric: 'challengesCompleted',
    required: 3,
  },
  {
    slug: 'react-master',
    name: 'React Master',
    icon: '⚡',
    rarity: 'epic',
    category: 'Framework',
    description: 'Avancou o bastante para encarar componentes, estado e hooks.',
    metric: 'completedLessons',
    required: 24,
  },
  {
    slug: 'python-mage',
    name: 'Python Mage',
    icon: '🧙',
    rarity: 'rare',
    category: 'Backend',
    description: 'Construiu uma base sólida para resolver problemas com lógica.',
    metric: 'level',
    required: 4,
  },
  {
    slug: 'cyber-sentinel',
    name: 'Cyber Sentinel',
    icon: '🛡️',
    rarity: 'epic',
    category: 'Security',
    description: 'Evoluiu ate pensar em seguranca, validacao e confiabilidade.',
    metric: 'completedLessons',
    required: 30,
  },
  {
    slug: 'ai-architect',
    name: 'AI Architect',
    icon: '🤖',
    rarity: 'legendary',
    category: 'AI',
    description: 'Acumulou XP suficiente para projetar solucoes mais inteligentes.',
    metric: 'xp',
    required: 1500,
  },
  {
    slug: 'streak-legend',
    name: 'Streak Legend',
    icon: '🌋',
    rarity: 'legendary',
    category: 'Streak',
    description: 'Manteve consistencia por varios dias seguidos.',
    metric: 'streak',
    required: 7,
  },
  {
    slug: 'html-explorer',
    name: 'HTML Explorer',
    icon: '🌐',
    rarity: 'common',
    category: 'Frontend',
    description: 'Comecou a explorar a estrutura da web com HTML.',
    metric: 'completedLessons',
    required: 1,
  },
]

export function getPlayerTag(slug?: string | null) {
  if (!slug) return null
  return PLAYER_TAGS.find((tag) => tag.slug === slug) ?? null
}

export function getTagProgress(tag: PlayerTag, metrics: ProgressionMetrics | null) {
  return metrics?.[tag.metric] ?? 0
}

export function getUnlockedTagSlugs(metrics: ProgressionMetrics | null) {
  return PLAYER_TAGS.filter((tag) => getTagProgress(tag, metrics) >= tag.required).map((tag) => tag.slug)
}

export function mergeUnlockedTags(profile: Profile | null | undefined, metrics: ProgressionMetrics | null) {
  return Array.from(new Set([...(profile?.unlocked_tags ?? []), ...(profile?.tags ?? []), ...getUnlockedTagSlugs(metrics)]))
}

export function isTagUnlocked(profile: Profile | null | undefined, tagSlug: string) {
  return Boolean(profile?.unlocked_tags?.includes(tagSlug) || profile?.tags?.includes(tagSlug))
}

export function getEquippedPlayerTag(profile: Profile | null | undefined) {
  const tag = getPlayerTag(profile?.equipped_tag)
  if (!tag) return null
  return isTagUnlocked(profile, tag.slug) ? tag : null
}
