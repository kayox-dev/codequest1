'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { AppShell } from '@/components/layout/AppShell'
import { supabase } from '@/lib/supabase'
import { getProgressionMetrics, percent, type ProgressionMetrics } from '@/services/progression.service'
import { useAppStore } from '@/store'

type SkillNode = {
  icon: string
  name: string
  desc: string
  requirement: keyof Pick<ProgressionMetrics, 'completedLessons' | 'completedTracks' | 'xp' | 'level' | 'streak'>
  required: number
}

const skills: SkillNode[] = [
  { icon: '🌱', name: 'Primeiro Commit', desc: 'Comece sua jornada dev', requirement: 'completedLessons', required: 0 },
  { icon: '🌐', name: 'HTML Fundamentos', desc: 'Complete sua primeira missão', requirement: 'completedLessons', required: 1 },
  { icon: '🧱', name: 'Estrutura Semântica', desc: 'Avance em três missões', requirement: 'completedLessons', required: 3 },
  { icon: '🎨', name: 'CSS Inicial', desc: 'Alcance 100 XP', requirement: 'xp', required: 100 },
  { icon: '📐', name: 'Layout Flexível', desc: 'Chegue ao nível 2', requirement: 'level', required: 2 },
  { icon: '⚡', name: 'Lógica JS', desc: 'Complete cinco missões', requirement: 'completedLessons', required: 5 },
  { icon: '🔗', name: 'DOM & Eventos', desc: 'Alcance 350 XP', requirement: 'xp', required: 350 },
  { icon: '🧩', name: 'Componentes', desc: 'Chegue ao nível 3', requirement: 'level', required: 3 },
  { icon: '🔥', name: 'Ritmo Diário', desc: 'Mantenha 3 dias de streak', requirement: 'streak', required: 3 },
  { icon: '🚀', name: 'Trilha Finalizada', desc: 'Finalize uma trilha completa', requirement: 'completedTracks', required: 1 },
  { icon: '🏆', name: 'Dev Ascendente', desc: 'Alcance 1000 XP', requirement: 'xp', required: 1000 },
  { icon: '🏆', name: 'Mestre da Jornada', desc: 'Finalize duas trilhas', requirement: 'completedTracks', required: 2 },
]

export default function SkillTree() {
  const { profile } = useAppStore()
  const [metrics, setMetrics] = useState<ProgressionMetrics | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const { data } = await supabase.auth.getUser()
        if (!data.user) return
        setMetrics(await getProgressionMetrics(data.user.id))
      } catch (err: any) {
        console.error('[SkillTree] failed to load progression', err)
        setError(err?.message ?? 'Não consegui carregar sua árvore de habilidades.')
      } finally {
        setLoading(false)
      }
    })()
  }, [profile])

  const unlockedCount = useMemo(() => {
    if (!metrics) return 0
    return skills.filter((skill) => metrics[skill.requirement] >= skill.required).length
  }, [metrics])

  return (
    <AppShell>
      <main className="skill-main">
        <div className="progression-head">
          <div>
            <div className="sec-title">Skill Tree</div>
            <p className="text-t2 text-sm">Árvore de talentos sincronizada com XP, nível, trilha atual e missões concluídas.</p>
          </div>
          <div className="progression-summary">
            <span>{unlockedCount}/{skills.length} liberadas</span>
            <span>{metrics?.xp ?? 0} XP</span>
            <span>Nível {metrics?.level ?? 1}</span>
          </div>
        </div>

        {error && <div className="mission-feedback error">{error}</div>}
        {loading && <div className="mission-feedback idle">Carregando árvore de habilidades...</div>}

        <div className="skill-tree rpg-tree">
          {skills.map((skill, index) => {
            const current = metrics?.[skill.requirement] ?? 0
            const unlocked = current >= skill.required
            const initial = index === 0
            const active = index === 0 && !unlocked
            const state = unlocked || index === 0 ? 'unlocked' : 'locked-skill'

            return (
              <motion.div
                className={`skill-node ${state}`}
                key={skill.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                {index < skills.length - 1 && <div className={`skill-link-line ${unlocked ? 'on' : ''}`} />}
                <div className="skill-icon">{skill.icon}</div>
                <div className="skill-name">{skill.name}</div>
                <div className="skill-desc">{skill.desc}</div>
                <div className={`skill-status ${unlocked ? 'done' : active || initial ? 'prog' : 'lock'}`}>
                  {unlocked ? '✓ Liberada' : initial ? 'Tutorial inicial' : '🔒 Bloqueada'}
                </div>
                <div className="skill-mini-bar">
                  <div style={{ width: `${unlocked ? 100 : 0}%` }} />
                </div>
              </motion.div>
            )
          })}
        </div>
      </main>
    </AppShell>
  )
}
