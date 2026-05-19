import { supabase } from '@/lib/supabase'

export type XpRewardResult = {
  already_claimed?: boolean
  xp_added: number
  new_xp: number
  new_level: number
  leveled_up: boolean
  reward_id?: string
  mission_key?: string
  challenge_slug?: string
  streak?: number
  best_streak?: number
  last_streak_date?: string | null
  counted_today?: boolean
  incremented?: boolean
  reset?: boolean
}

function normalizeXpReward(data: unknown): XpRewardResult {
  if (!data || typeof data !== 'object') {
    throw new Error('O Supabase nao retornou a recompensa de XP.')
  }

  const reward = data as Partial<XpRewardResult>
  if (typeof reward.new_xp !== 'number' || typeof reward.new_level !== 'number' || typeof reward.xp_added !== 'number') {
    console.error('[xpService] invalid reward payload', data)
    throw new Error('Resposta de XP invalida. O perfil nao foi atualizado.')
  }

  return {
    already_claimed: Boolean(reward.already_claimed),
    xp_added: reward.xp_added,
    new_xp: reward.new_xp,
    new_level: reward.new_level,
    leveled_up: Boolean(reward.leveled_up),
    reward_id: reward.reward_id,
    mission_key: reward.mission_key,
    challenge_slug: reward.challenge_slug,
    streak: reward.streak,
    best_streak: reward.best_streak,
    last_streak_date: reward.last_streak_date,
    counted_today: reward.counted_today,
    incremented: reward.incremented,
    reset: reward.reset,
  }
}

export const xpService = {
  async claimMissionReward(params: {
    userId: string
    missionKey: string
    missionType: 'daily' | 'weekly' | 'special'
    xpReward: number
    description: string
  }) {
    const { data, error } = await supabase.rpc('claim_mission_reward', {
      p_user_id: params.userId,
      p_mission_key: params.missionKey,
      p_mission_type: params.missionType,
      p_xp_reward: params.xpReward,
      p_description: params.description,
    })

    if (error) {
      console.error('[xpService.claimMissionReward] Supabase error', { params, error })
      throw error
    }

    return normalizeXpReward(data)
  },

  async claimChallengeReward(params: {
    userId: string
    challengeSlug: string
    xpReward: number
    description: string
  }) {
    const { data, error } = await supabase.rpc('claim_challenge_reward', {
      p_user_id: params.userId,
      p_challenge_slug: params.challengeSlug,
      p_xp_reward: params.xpReward,
      p_description: params.description,
    })

    if (error) {
      console.error('[xpService.claimChallengeReward] Supabase error', { params, error })
      throw error
    }

    return normalizeXpReward(data)
  },
}
