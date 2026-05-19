'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Brain,
  ChevronRight,
  Crown,
  Flame,
  Globe2,
  Medal,
  Rocket,
  Shield,
  SkipForward,
  Sparkles,
  Tags,
  Trophy,
  Zap,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { profileService } from '@/services/auth.service'
import { useAppStore } from '@/store'

const features = [
  { icon: Flame, title: 'STREAK', copy: 'Mantenha sua sequência diária e evolua mais rápido.', color: '#FF6B35' },
  { icon: Trophy, title: 'RANKING', copy: 'Suba no ranking global e mostre suas habilidades.', color: '#FFD166' },
  { icon: Zap, title: 'XP E LEVEL', copy: 'Complete desafios para ganhar XP e desbloquear níveis.', color: '#4DBBFF' },
  { icon: Tags, title: 'TAGS E TÍTULOS', copy: 'Equipe títulos únicos como Frontend Warrior, React Master e Bug Hunter.', color: '#9B6FFF' },
  { icon: Medal, title: 'CONQUISTAS', copy: 'Desbloqueie badges raras e construa sua reputação.', color: '#2ECC71' },
  { icon: Brain, title: 'TRILHAS', copy: 'Escolha sua jornada: Frontend, Backend, Python, Cybersecurity e muito mais.', color: '#F5A623' },
  { icon: Crown, title: 'BOSS CHALLENGES', copy: 'Enfrente desafios épicos para desbloquear novas áreas.', color: '#E74C3C' },
  { icon: Globe2, title: 'PERFIL PÚBLICO', copy: 'Mostre seu nível, streak, conquistas e progresso.', color: '#1ABC9C' },
]

const tracks = [
  { name: 'Frontend', art: '/track-art/frontend.svg', difficulty: 'Iniciante', xp: '4.800 XP', glow: '#7C3FFF' },
  { name: 'Backend', art: '/track-art/backend.svg', difficulty: 'Intermediário', xp: '5.400 XP', glow: '#2ECC71' },
  { name: 'Python', art: '/track-art/python.svg', difficulty: 'Iniciante', xp: '4.200 XP', glow: '#F5A623' },
  { name: 'Cybersecurity', art: '/track-art/cybersecurity.svg', difficulty: 'Avançado', xp: '6.200 XP', glow: '#E74C3C' },
  { name: 'AI Engineer', art: '/track-art/ai-engineer.svg', difficulty: 'Avançado', xp: '7.100 XP', glow: '#4DBBFF' },
]

const leaders = [
  { rank: '01', name: 'DevMaster', level: 24, xp: '18.940 XP', tag: 'React Master', country: 'BR' },
  { rank: '02', name: 'KayoDev', level: 22, xp: '17.310 XP', tag: 'Frontend Warrior', country: 'PT' },
  { rank: '03', name: 'ShadowJS', level: 20, xp: '15.880 XP', tag: 'Bug Hunter', country: 'US' },
]

const particlePositions = Array.from({ length: 28 }, (_, index) => ({
  left: `${(index * 37) % 100}%`,
  top: `${(index * 53) % 100}%`,
  delay: (index % 7) * 0.25,
  size: 2 + (index % 4),
}))

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 },
}

export default function CodeQuestIntro() {
  const router = useRouter()
  const { profile, loadingProfile, updateProfile } = useAppStore()
  const [finishing, setFinishing] = useState(false)
  const userName = profile?.username || 'Developer'

  const storageKey = useMemo(() => (profile?.user_id ? `codequest_intro_completed_${profile.user_id}` : null), [profile?.user_id])

  useEffect(() => {
    if (loadingProfile) return
    if (!profile?.onboarding_completed) {
      router.replace('/onboarding')
      return
    }

    const localDone = storageKey ? localStorage.getItem(storageKey) === 'true' : false
    if (profile?.intro_completed || localDone) {
      router.replace(profile?.selected_track_id ? '/dashboard' : '/escolha-trilha')
    }
  }, [loadingProfile, profile, router, storageKey])

  async function completeIntro() {
    if (finishing) return
    setFinishing(true)

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error) throw error
      if (!user?.id) {
        router.push('/auth/login')
        return
      }

      const key = `codequest_intro_completed_${user.id}`
      localStorage.setItem(key, 'true')

      try {
        const nextProfile = await profileService.updateProfile(user.id, { intro_completed: true })
        updateProfile(nextProfile)
        router.push(nextProfile.selected_track_id ? '/dashboard' : '/escolha-trilha')
      } catch (dbError) {
        console.error('[Intro] failed to persist intro_completed', dbError)
        toast.error('Intro concluída localmente. Sincronize o banco quando possível.')
        router.push(profile?.selected_track_id ? '/dashboard' : '/escolha-trilha')
      }
    } finally {
      setFinishing(false)
    }
  }

  return (
    <main className="cq-intro-shell">
      <div className="cq-intro-ambient" aria-hidden="true">
        {particlePositions.map((particle, index) => (
          <motion.span
            key={index}
            className="cq-intro-particle"
            style={{ left: particle.left, top: particle.top, width: particle.size, height: particle.size }}
            animate={{ opacity: [0.18, 0.86, 0.18], y: [0, -18, 0], scale: [1, 1.7, 1] }}
            transition={{ duration: 4.2, delay: particle.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
        <motion.div className="cq-intro-rift" animate={{ rotate: 360 }} transition={{ duration: 34, repeat: Infinity, ease: 'linear' }} />
      </div>

      <div className="cq-intro-topbar">
        <div className="cq-intro-brand">
          <span>CQ</span>
          <strong>CodeQuest</strong>
        </div>
        <button type="button" className="cq-intro-skip" onClick={completeIntro} disabled={finishing}>
          <SkipForward size={16} />
          Pular introdução
        </button>
      </div>

      <section className="cq-intro-hero">
        <motion.div className="cq-intro-hero-copy" initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.75 }}>
          <div className="cq-intro-kicker">
            <Sparkles size={15} />
            Campanha inicial desbloqueada
          </div>
          <h1>Aprenda programação como um RPG.</h1>
          <p>
            Ganhe XP, suba de nível, desbloqueie habilidades e evolua como desenvolvedor enquanto compete com jogadores do mundo inteiro.
          </p>
          <div className="cq-intro-actions">
            <button type="button" className="cq-intro-primary" onClick={() => document.getElementById('cq-features')?.scrollIntoView({ behavior: 'smooth' })}>
              Começar jornada
              <ChevronRight size={18} />
            </button>
            <span>Bem-vindo, {userName}</span>
          </div>
        </motion.div>

      </section>

      <motion.section id="cq-features" className="cq-intro-section" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} transition={{ duration: 0.6 }}>
        <div className="cq-section-head">
          <span>Sistema de progressão</span>
          <h2>Tudo que transforma estudo em aventura.</h2>
        </div>
        <div className="cq-feature-grid">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.article key={feature.title} className="cq-feature-card" whileHover={{ y: -6, scale: 1.01 }} transition={{ type: 'spring', stiffness: 240, damping: 18 }}>
                <div className="cq-feature-icon" style={{ color: feature.color, boxShadow: `0 0 26px ${feature.color}44` }}>
                  <Icon size={22} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.copy}</p>
                <span>{String(index + 1).padStart(2, '0')}</span>
              </motion.article>
            )
          })}
        </div>
      </motion.section>

      <section className="cq-intro-section cq-track-section">
        <div className="cq-section-head">
          <span>Escolha sua classe</span>
          <h2>Trilhas desenhadas como campanhas.</h2>
        </div>
        <div className="cq-track-grid">
          {tracks.map((track) => (
            <motion.article key={track.name} className="cq-track-card" whileHover={{ y: -8 }} style={{ '--track-glow': track.glow } as CSSProperties}>
              <div className="cq-track-art">
                <Image src={track.art} alt="" width={280} height={180} unoptimized />
              </div>
              <h3>{track.name}</h3>
              <div className="cq-track-meta">
                <span>{track.difficulty}</span>
                <span>{track.xp}</span>
              </div>
              <button type="button" onClick={() => document.getElementById('cq-final')?.scrollIntoView({ behavior: 'smooth' })}>Explorar</button>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="cq-intro-section cq-leaderboard-wrap">
        <div className="cq-section-head">
          <span>Arena global</span>
          <h2>Veja quem domina a temporada.</h2>
        </div>
        <div className="cq-leaderboard">
          {leaders.map((leader) => (
            <motion.div key={leader.name} className="cq-leader-row" whileHover={{ x: 6 }}>
              <div className="cq-leader-rank">{leader.rank}</div>
              <div className="cq-leader-main">
                <strong>{leader.name}</strong>
                <span>{leader.tag}</span>
              </div>
              <div className="cq-leader-xp">{leader.xp}</div>
              <div className="cq-leader-country">{leader.country}</div>
              <div className="cq-leader-level">
                <Medal size={15} />
                Level {leader.level}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="cq-final" className="cq-intro-final">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65 }}>
          <Rocket size={34} />
          <h2>Transforme sua evolução como desenvolvedor em uma aventura.</h2>
          <p>Seu personagem, sua trilha, seus bosses e sua reputação começam agora.</p>
          <button type="button" className="cq-intro-primary" onClick={completeIntro} disabled={finishing}>
            {finishing ? 'Entrando...' : 'Entrar na CodeQuest'}
            <Shield size={18} />
          </button>
        </motion.div>
      </section>
    </main>
  )
}
