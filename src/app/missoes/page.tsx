'use client'

import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { AppShell } from '@/components/layout/AppShell'
import { supabase } from '@/lib/supabase'
import { getLocalDateString, getProgressionMetrics, percent, type ProgressionMetrics } from '@/services/progression.service'
import { xpService } from '@/services/xp.service'
import { useAppStore } from '@/store'

type MissionType = 'daily' | 'weekly' | 'special'
type MissionRequirement = keyof Pick<ProgressionMetrics, 'completedLessons' | 'completedLessonsToday' | 'completedLessonsThisWeek' | 'lessonActivityToday' | 'completedTracks' | 'activeTrackProgress' | 'challengesCompleted' | 'streak' | 'xp'>
type MissionState = 'locked' | 'progress' | 'available' | 'claimed'
type Mission = {
  id: string
  type: MissionType
  icon: string
  iconBg: string
  title: string
  sub: string
  goal: number
  xp: number
  fillColor: string
  requirement: MissionRequirement
}

const tabs: { key: MissionType; label: string; helper: string }[] = [
  { key: 'daily', label: 'Diárias', helper: 'Recompensas liberadas por ações reais do dia.' },
  { key: 'weekly', label: 'Semanais', helper: 'Objetivos maiores: acompanhe o contador antes de resgatar.' },
  { key: 'special', label: 'Especiais', helper: 'Eventos e marcos raros; só liberam com progresso real.' },
]

const missions: Mission[] = [
  { id: 'daily-lesson', type: 'daily', icon: '📖', iconBg: 'var(--accent-dim)', title: 'Complete 1 lição hoje', sub: 'Só libera após concluir uma lição real hoje', goal: 1, xp: 80, fillColor: 'var(--accent)', requirement: 'completedLessonsToday' },
  { id: 'daily-editor', type: 'daily', icon: '💻', iconBg: 'rgba(77,187,255,.1)', title: 'Resolva no editor hoje', sub: 'Conclua uma missão de código hoje', goal: 1, xp: 60, fillColor: 'var(--gem)', requirement: 'completedLessonsToday' },
  { id: 'daily-streak', type: 'daily', icon: '🔥', iconBg: 'var(--green-dim)', title: 'Mantenha o streak', sub: 'Entre em uma lição real da trilha hoje', goal: 1, xp: 50, fillColor: 'var(--green)', requirement: 'lessonActivityToday' },
  { id: 'daily-challenge', type: 'daily', icon: '⚡', iconBg: 'rgba(255,107,53,.12)', title: 'Resolva 1 desafio', sub: 'Complete um desafio permanente', goal: 1, xp: 90, fillColor: 'var(--orange)', requirement: 'challengesCompleted' },

  { id: 'weekly-five-lessons', type: 'weekly', icon: '🗓️', iconBg: 'var(--accent-dim)', title: 'Complete 5 lições na semana', sub: 'Contador real de lições concluídas nesta semana', goal: 5, xp: 350, fillColor: 'var(--accent)', requirement: 'completedLessonsThisWeek' },
  { id: 'weekly-track', type: 'weekly', icon: '🧭', iconBg: 'rgba(77,187,255,.1)', title: 'Avance 30% em uma trilha', sub: 'Usa o progresso real da trilha ativa', goal: 30, xp: 380, fillColor: 'var(--gem)', requirement: 'activeTrackProgress' },
  { id: 'weekly-challenges', type: 'weekly', icon: '🏁', iconBg: 'rgba(255,107,53,.12)', title: 'Complete 3 desafios', sub: 'Desafios permanentes concluídos', goal: 3, xp: 450, fillColor: 'var(--orange)', requirement: 'challengesCompleted' },
  { id: 'weekly-xp', type: 'weekly', icon: '🏆', iconBg: 'rgba(245,166,35,.12)', title: 'Alcance 500 XP', sub: 'XP total salvo no perfil', goal: 500, xp: 320, fillColor: 'var(--gold)', requirement: 'xp' },

  { id: 'special-first-track', type: 'special', icon: '🏆', iconBg: 'rgba(245,166,35,.12)', title: 'Conclua sua primeira trilha', sub: 'Só libera quando uma trilha for finalizada', goal: 1, xp: 700, fillColor: 'var(--gold)', requirement: 'completedTracks' },
  { id: 'special-codequest-veteran', type: 'special', icon: '♿', iconBg: 'var(--green-dim)', title: 'Complete 20 lições', sub: 'Marco longo de aprendizado real', goal: 20, xp: 650, fillColor: 'var(--green)', requirement: 'completedLessons' },
  { id: 'special-api-hunter', type: 'special', icon: '🔌', iconBg: 'rgba(77,187,255,.1)', title: 'Acumule 1000 XP', sub: 'XP real vindo de lições e desafios', goal: 1000, xp: 620, fillColor: 'var(--gem)', requirement: 'xp' },
  { id: 'special-capstone', type: 'special', icon: '👑', iconBg: 'var(--accent-dim)', title: 'Finalize 2 trilhas', sub: 'Marcos especiais exigem trilhas concluídas', goal: 2, xp: 1000, fillColor: 'var(--accent)', requirement: 'completedTracks' },
]

export default function Missoes() {
  const { profile, updateProfile } = useAppStore()
  const [activeTab, setActiveTab] = useState<MissionType>('daily')
  const [metrics, setMetrics] = useState<ProgressionMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState('')
  const currentTab = tabs.find((tab) => tab.key === activeTab) ?? tabs[0]

  async function loadMetrics() {
    setLoading(true)
    try {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        setMetrics(null)
        return
      }
      setMetrics(await getProgressionMetrics(data.user.id))
    } catch (error: any) {
      console.error('[Missoes] failed to load real mission metrics', error)
      toast.error(error?.message ?? 'Não consegui carregar o progresso das missões.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMetrics()
  }, [profile?.xp_total, profile?.level, profile?.streak, profile?.selected_track_id])

  const visibleMissions = useMemo(() => dedupeMissions(missions).filter((mission) => mission.type === activeTab), [activeTab])
  const claimedKeys = metrics?.claimedMissionKeys ?? []
  const claimedInTab = visibleMissions.filter((mission) => claimedKeys.includes(getMissionKey(mission))).length
  const availableInTab = visibleMissions.filter((mission) => getMissionState(mission, metrics) === 'available').length

  async function claimReward(mission: Mission) {
    const state = getMissionState(mission, metrics)

    if (state === 'claimed') {
      toast('Recompensa já resgatada.')
      return
    }

    if (state !== 'available') {
      toast.error('Complete o requisito real antes de resgatar esta missão.')
      return
    }

    setClaiming(mission.id)
    try {
      const { data } = await supabase.auth.getUser()
      if (!data.user) throw new Error('Entre novamente para resgatar a recompensa.')

      const reward = await xpService.claimMissionReward({
        userId: data.user.id,
        missionKey: getMissionKey(mission),
        missionType: mission.type,
        xpReward: mission.xp,
        description: `Missão resgatada: ${mission.title}`,
      })

      if (typeof reward.new_xp === 'number' && typeof reward.new_level === 'number') {
        updateProfile({ xp_total: reward.new_xp, level: reward.new_level })
      }

      toast.success(reward.already_claimed ? 'Recompensa já estava resgatada.' : `Recompensa resgatada: +${reward.xp_added} XP`)
      await loadMetrics()
    } catch (error: any) {
      console.error('[Missoes] claim failed', { mission, error })
      toast.error(error?.message ?? 'Não consegui salvar a recompensa agora.')
    } finally {
      setClaiming('')
    }
  }

  return (
    <AppShell>
      <main className="missoes-main">
        <div className="missoes-head">
          <div>
            <div className="sec-title">Missões</div>
            <div className="missoes-sub">{currentTab.helper}</div>
          </div>
          <div className="missoes-tabs" role="tablist" aria-label="Tipos de missão">
            {tabs.map((tab) => (
              <button key={tab.key} type="button" role="tab" aria-selected={activeTab === tab.key} className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mission-tab-summary">
          <span>{claimedInTab}/{visibleMissions.length} recompensas resgatadas</span>
          <span>{availableInTab} disponíveis para resgate</span>
          <button type="button" className="mission-refresh" onClick={loadMetrics} disabled={loading}>
            Atualizar
          </button>
        </div>

        <div className="missoes-list" role="tabpanel">
          {visibleMissions.map((mission) => {
            const current = getMissionCurrent(mission, metrics)
            const state = getMissionState(mission, metrics)
            const fill = `${percent(current, mission.goal)}%`

            return (
              <MissionRow
                key={mission.id}
                mission={mission}
                current={current}
                fill={fill}
                state={state}
                onClaim={() => claimReward(mission)}
                claiming={claiming === mission.id}
              />
            )
          })}
        </div>
      </main>
    </AppShell>
  )
}

function getMissionCurrent(mission: Mission, metrics: ProgressionMetrics | null) {
  return Math.min(metrics?.[mission.requirement] ?? 0, mission.goal)
}

function dedupeMissions(items: Mission[]) {
  const byId = new Map<string, Mission>()
  for (const mission of items) byId.set(mission.id, mission)
  return Array.from(byId.values())
}

function getMissionState(mission: Mission, metrics: ProgressionMetrics | null): MissionState {
  if (metrics?.claimedMissionKeys.includes(getMissionKey(mission))) return 'claimed'
  const current = getMissionCurrent(mission, metrics)
  if (current >= mission.goal) return 'available'
  if (current > 0) return 'progress'
  return 'locked'
}

function getMissionKey(mission: Mission) {
  if (mission.type === 'special') return mission.id

  const now = new Date()
  if (mission.type === 'daily') return `${mission.id}:${getLocalDateString(now)}`

  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const week = Math.ceil((((now.getTime() - startOfYear.getTime()) / 86400000) + startOfYear.getDay() + 1) / 7)
  return `${mission.id}:${now.getFullYear()}-W${String(week).padStart(2, '0')}`
}

function stateLabel(state: MissionState) {
  if (state === 'claimed') return 'Recompensa resgatada'
  if (state === 'available') return 'Recompensa disponível'
  if (state === 'progress') return 'Em progresso'
  return 'Bloqueada'
}

function MissionRow({
  mission,
  current,
  fill,
  state,
  onClaim,
  claiming,
}: {
  mission: Mission
  current: number
  fill: string
  state: MissionState
  onClaim: () => void
  claiming: boolean
}) {
  const canClaim = state === 'available'

  return (
    <article className={`mission-row mission-row-real state-${state}`}>
      <div className="mr-icon" style={{ background: mission.iconBg }}>
        {mission.icon}
      </div>
      <div className="mr-info">
        <div className="mr-title">{mission.title}</div>
        <div className="mr-sub">{mission.sub}</div>
        <div className={`mission-state-label ${state}`}>{stateLabel(state)}</div>
      </div>
      <div className="mr-prog-wrap">
        <div style={{ fontSize: 10.5, color: state === 'claimed' ? 'var(--green)' : 'var(--t3)', textAlign: 'right' }}>{current}/{mission.goal}</div>
        <div className="mr-prog-bar">
          <div className="mr-prog-fill" style={{ background: mission.fillColor, width: fill }} />
        </div>
      </div>
      {state === 'claimed' ? (
        <div className="mr-check">✓</div>
      ) : (
        <button type="button" className="btn-secondary mission-claim-btn" onClick={onClaim} disabled={!canClaim || claiming}>
          {claiming ? 'Salvando...' : canClaim ? `Resgatar +${mission.xp} XP` : `+${mission.xp} XP`}
        </button>
      )}
    </article>
  )
}
