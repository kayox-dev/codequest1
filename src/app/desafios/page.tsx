'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { AppShell } from '@/components/layout/AppShell'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store'
import { challenges } from './challenges'

const filters = ['Todos', 'Básico', 'Intermediário', 'Avançado', 'Épico'] as const

export default function Desafios() {
  const { profile } = useAppStore()
  const [filter, setFilter] = useState<(typeof filters)[number]>('Todos')
  const [completed, setCompleted] = useState<string[]>([])
  const level = profile?.level ?? 1

  useEffect(() => {
    ;(async () => {
      const localCompleted = JSON.parse(localStorage.getItem('codequest-completed-challenges') ?? '[]')
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        setCompleted(Array.isArray(localCompleted) ? localCompleted : [])
        return
      }

      const { data, error } = await supabase.from('user_challenge_rewards').select('challenge_slug').eq('user_id', userData.user.id)
      if (error && error.code !== '42P01') {
        console.error('[Desafios] failed to load completed challenges', error)
      }

      const completedIds = new Set([
        ...(Array.isArray(localCompleted) ? localCompleted : []),
        ...((data ?? []).map((item) => item.challenge_slug)),
      ])
      const nextCompleted = Array.from(completedIds)
      localStorage.setItem('codequest-completed-challenges', JSON.stringify(nextCompleted))
      setCompleted(nextCompleted)
    })()
  }, [])

  const visible = useMemo(() => challenges.filter((item) => filter === 'Todos' || item.mode === filter), [filter])

  return (
    <AppShell>
      <main className="desafios-main">
        <div className="progression-head">
          <div>
            <div className="sec-title">Desafios</div>
            <p className="text-t2 text-sm">Desbloqueie novos modos conforme sobe de nível.</p>
          </div>
          <div className="progression-summary">
            <span>Nível {level}</span>
            <span>{completed.length}/{challenges.length} concluídos</span>
          </div>
        </div>
        <div className="filter-row">
          {filters.map((item) => (
            <button key={item} className={`filter-btn ${filter === item ? 'active' : ''}`} onClick={() => setFilter(item)}>
              {item}
            </button>
          ))}
        </div>
        <div className="desafios-grid">
          {visible.map((challenge, index) => {
            const unlocked = level >= challenge.level
            const done = completed.includes(challenge.slug)
            const card = (
              <motion.article className={`dc challenge-card ${!unlocked ? 'locked' : ''} ${done ? 'done' : ''}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                <div className="dc-tag">{challenge.tag}</div>
                <div className="dc-title">{challenge.title}</div>
                <div className="dc-desc">{challenge.desc}</div>
                <div className="challenge-level-row">
                  <span>{challenge.mode}</span>
                  <span>{unlocked ? 'Disponível' : `Nível ${challenge.level}`}</span>
                </div>
                <div className="dc-footer">
                  <span className="dc-xp">+{challenge.xp} XP</span>
                  <span className={`badge ${challenge.diff === 'Difícil' ? 'badge-hard' : challenge.diff === 'Médio' ? 'badge-med' : 'badge-easy'}`}>
                    {challenge.diff}
                  </span>
                </div>
                <div className="btn-primary w-full mt-3">{done ? 'Revisar desafio' : unlocked ? 'Iniciar desafio' : 'Bloqueado'}</div>
              </motion.article>
            )

            return unlocked ? (
              <Link key={challenge.slug} href={`/desafios/${challenge.slug}`} className="challenge-link">
                {card}
              </Link>
            ) : (
              <div key={challenge.slug}>{card}</div>
            )
          })}
        </div>
      </main>
    </AppShell>
  )
}
