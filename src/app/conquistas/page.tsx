'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { AppShell } from '@/components/layout/AppShell'
import { supabase } from '@/lib/supabase'
import { getProgressionMetrics, percent, type ProgressionMetrics } from '@/services/progression.service'
import { useAppStore } from '@/store'

type Achievement = {
  icon: string
  name: string
  desc: string
  rarity: 'comum' | 'rara' | 'épica' | 'lendária'
  metric: keyof Pick<ProgressionMetrics, 'completedLessons' | 'completedTracks' | 'xp' | 'level' | 'streak' | 'challengesCompleted' | 'dailyMissionsCompleted' | 'weeklyMissionsCompleted' | 'specialMissionsCompleted'>
  required: number
}

const achievements: Achievement[] = [
  { icon: '🏅', name: 'Primeira Missão', desc: 'Conclua sua primeira missão', rarity: 'comum', metric: 'completedLessons', required: 1 },
  { icon: '🧭', name: 'Primeira Trilha Iniciada', desc: 'Comece uma trilha de aprendizado', rarity: 'comum', metric: 'completedLessons', required: 1 },
  { icon: '🚀', name: 'Primeira Trilha Finalizada', desc: 'Finalize uma trilha completa', rarity: 'épica', metric: 'completedTracks', required: 1 },
  { icon: '🔮', name: '100 XP', desc: 'Acumule 100 XP total', rarity: 'comum', metric: 'xp', required: 100 },
  { icon: '🏆', name: '500 XP', desc: 'Acumule 500 XP total', rarity: 'rara', metric: 'xp', required: 500 },
  { icon: '👑', name: '1000 XP', desc: 'Acumule 1000 XP total', rarity: 'épica', metric: 'xp', required: 1000 },
  { icon: '🔥', name: '7 Dias Seguidos', desc: 'Mantenha 7 dias de streak', rarity: 'épica', metric: 'streak', required: 7 },
  { icon: '🌋', name: '30 Dias Seguidos', desc: 'Mantenha 30 dias de streak', rarity: 'lendária', metric: 'streak', required: 30 },
  { icon: '🌐', name: 'HTML Completo', desc: 'Avance bastante na jornada HTML', rarity: 'rara', metric: 'completedLessons', required: 12 },
  { icon: '🎨', name: 'CSS Completo', desc: 'Avance bastante na jornada CSS', rarity: 'rara', metric: 'completedLessons', required: 24 },
  { icon: '⚡', name: 'JavaScript Completo', desc: 'Avance bastante na jornada JavaScript', rarity: 'épica', metric: 'completedLessons', required: 36 },
  { icon: '⚛️', name: 'React Completo', desc: 'Avance bastante na jornada React', rarity: 'épica', metric: 'completedLessons', required: 48 },
  { icon: '☀️', name: 'Diária Completa', desc: 'Complete uma missão diária', rarity: 'comum', metric: 'dailyMissionsCompleted', required: 1 },
  { icon: '🗓️', name: 'Semanal Completa', desc: 'Complete uma missão semanal', rarity: 'rara', metric: 'weeklyMissionsCompleted', required: 1 },
  { icon: '🏆', name: 'Especial Completa', desc: 'Complete uma missão especial', rarity: 'épica', metric: 'specialMissionsCompleted', required: 1 },
  { icon: '⚡', name: 'Desafiante', desc: 'Complete 3 desafios permanentes', rarity: 'rara', metric: 'challengesCompleted', required: 3 },
  { icon: '♿', name: 'Guardião A11y', desc: 'Avance em acessibilidade', rarity: 'rara', metric: 'completedLessons', required: 20 },
  { icon: '📱', name: 'Responsivo Real', desc: 'Avance em responsividade', rarity: 'rara', metric: 'completedLessons', required: 28 },
  { icon: '🟢', name: 'Backend Builder', desc: 'Avance em APIs e backend', rarity: 'épica', metric: 'completedLessons', required: 40 },
  { icon: '🗄️', name: 'SQL Mapper', desc: 'Avance em banco de dados', rarity: 'épica', metric: 'completedLessons', required: 44 },
  { icon: '🧼', name: 'Clean Code', desc: 'Complete muitas revisões e refinos', rarity: 'épica', metric: 'completedLessons', required: 55 },
  { icon: '👑', name: 'Lenda Dev', desc: 'Acumule 1500 XP', rarity: 'lendária', metric: 'xp', required: 1500 },
]

export default function Conquistas() {
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
        console.error('[Conquistas] failed to load achievements', err)
        setError(err?.message ?? 'Não consegui carregar suas conquistas.')
      } finally {
        setLoading(false)
      }
    })()
  }, [profile])

  const earnedCount = useMemo(() => achievements.filter((item) => (metrics?.[item.metric] ?? 0) >= item.required).length, [metrics])
  const completion = percent(earnedCount, achievements.length)

  return (
    <AppShell>
      <main className="conquistas-main">
        <div className="progression-head">
          <div>
            <div className="sec-title">Conquistas</div>
            <p className="text-t2 text-sm">Badges só liberam quando você cumpre condições reais da jornada.</p>
          </div>
          <div className="progression-summary">
            <span>{earnedCount}/{achievements.length}</span>
            <span>{completion}% completo</span>
          </div>
        </div>

        {error && <div className="mission-feedback error">{error}</div>}
        {loading && <div className="mission-feedback idle">Carregando conquistas...</div>}

        <div className="conquistas-grid">
          {achievements.map((award, index) => {
            const current = metrics?.[award.metric] ?? 0
            const earned = current >= award.required
            return (
              <motion.div
                className={`conq-card ${earned ? 'earned' : 'locked'} rarity-${award.rarity}`}
                key={award.name}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.025 }}
              >
                <div className="conq-icon">{award.icon}</div>
                <div className="conq-name">{award.name}</div>
                <div className="conq-desc">{award.desc}</div>
                <div className={`conq-badge ${earned ? 'earned' : 'locked'}`}>
                  {earned ? '✓ Conquistado' : `🔒 ${current}/${award.required}`}
                </div>
                <div className="achievement-progress">
                  <div style={{ width: `${percent(current, award.required)}%` }} />
                </div>
                <div className="achievement-rarity">{award.rarity}</div>
              </motion.div>
            )
          })}
        </div>
      </main>
    </AppShell>
  )
}
