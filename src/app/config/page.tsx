'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { AppShell } from '@/components/layout/AppShell'
import { authService, profileService } from '@/services/auth.service'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store'

type Settings = {
  dailyReminder: boolean
  newMissions: boolean
  rankingUpdates: boolean
  weeklyEmail: boolean
  soundFeedback: boolean
  theme: 'dark' | 'light'
}

const defaultSettings: Settings = {
  dailyReminder: true,
  newMissions: true,
  rankingUpdates: false,
  weeklyEmail: false,
  soundFeedback: true,
  theme: 'dark',
}

export default function Config() {
  const router = useRouter()
  const { profile, updateProfile } = useAppStore()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState(profile?.username ?? '')
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<Settings>(defaultSettings)

  useEffect(() => {
    const saved = localStorage.getItem('codequest-settings')
    const next = saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings
    setSettings(next)
    document.documentElement.dataset.theme = next.theme

    ;(async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push('/auth/login')
        return
      }
      setEmail(data.user.email ?? '')
    })()
  }, [router])

  useEffect(() => {
    setUsername(profile?.username ?? '')
  }, [profile?.username])

  function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    const next = { ...settings, [key]: value }
    setSettings(next)
    localStorage.setItem('codequest-settings', JSON.stringify(next))
    if (key === 'theme') document.documentElement.dataset.theme = String(value)
  }

  async function saveProfile() {
    setSaving(true)
    try {
      const { data } = await supabase.auth.getUser()
      if (!data.user) return router.push('/auth/login')
      const next = await profileService.updateProfile(data.user.id, { username: username.trim() || null })
      updateProfile(next)
      toast.success('Configurações salvas')
    } catch (error: any) {
      console.error('[Config] save failed', error)
      toast.error(error?.message ?? 'Não consegui salvar agora.')
    } finally {
      setSaving(false)
    }
  }

  async function signOut() {
    await authService.signOut()
    router.push('/')
  }

  return (
    <AppShell>
      <main className="config-main config-main-wide">

        <div className="progression-head">
          <div>
            <div className="sec-title">Configurações</div>
            <p className="text-t2 text-sm">Dados reais da conta, preferências e perfil do jogador.</p>
          </div>
          <button className="btn-primary" onClick={saveProfile} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar perfil'}
          </button>
        </div>

        <Section title="Conta">
          <EditableRow label="Nome de usuário" sub="Nome exibido no perfil e ranking">
            <input className="config-input" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Seu nome de usuário" />
          </EditableRow>
          <Row label="E-mail" sub={email || 'Carregando...'} action={<span className="config-muted-action">Gerenciado pelo login</span>} />
          <Row label="Nível" sub={`Nível ${profile?.level ?? 1} · ${profile?.xp_total ?? 0} XP · streak ${profile?.streak ?? 0}`} action={<Link className="btn-secondary" href="/perfil">Ver perfil</Link>} />
        </Section>

        <Section title="Jogador">
          <Row label="Avatar do jogador" sub="Troque skin, raridade e visual" action={<Link className="btn-primary" href="/config/avatar">Editar avatar</Link>} />
          <Row label="Tags do perfil" sub={profile?.equipped_tag ? 'Titulo ativo sincronizado no perfil e ranking' : 'Equipe um titulo principal'} action={<Link className="btn-primary" href="/config/tags">Gerenciar tags</Link>} />
          <Row label="Trilha atual" sub={profile?.selected_track_id ? 'Sincronizada com seu progresso' : 'Nenhuma trilha escolhida'} action={<Link className="btn-secondary" href="/escolha-trilha">Trocar trilha</Link>} />
        </Section>

        <Section title="Notificações">
          <ToggleRow label="Lembrete diário" sub="Receba alertas para manter seu streak" on={settings.dailyReminder} onClick={() => updateSetting('dailyReminder', !settings.dailyReminder)} />
          <ToggleRow label="Novas missões" sub="Avisar quando houver missões disponíveis" on={settings.newMissions} onClick={() => updateSetting('newMissions', !settings.newMissions)} />
          <ToggleRow label="Ranking updates" sub="Mudanças na sua posição do ranking" on={settings.rankingUpdates} onClick={() => updateSetting('rankingUpdates', !settings.rankingUpdates)} />
          <ToggleRow label="E-mail semanal" sub="Resumo de progresso toda segunda-feira" on={settings.weeklyEmail} onClick={() => updateSetting('weeklyEmail', !settings.weeklyEmail)} />
        </Section>

        <Section title="Aparência">
          <EditableRow label="Tema" sub="Alterna visual claro/escuro localmente">
            <select className="config-select" value={settings.theme} onChange={(event) => updateSetting('theme', event.target.value as Settings['theme'])}>
              <option value="dark">Dark premium</option>
              <option value="light">Light</option>
            </select>
          </EditableRow>
          <ToggleRow label="Sons de feedback" sub="Efeitos sonoros ao concluir missões" on={settings.soundFeedback} onClick={() => updateSetting('soundFeedback', !settings.soundFeedback)} />
        </Section>

        <Section title="Sessão">
          <Row label="Sair da conta" sub="Encerra sua sessão neste dispositivo" action={<button className="config-danger-btn" onClick={signOut}>Sair</button>} danger />
        </Section>
      </main>
    </AppShell>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="config-section">
      <div className="config-section-title">{title}</div>
      {children}
    </div>
  )
}

function Row({ label, sub, action, danger }: { label: string; sub: string; action: React.ReactNode; danger?: boolean }) {
  return (
    <div className="config-row">
      <div className="config-row-copy">
        <div className="cr-label" style={danger ? { color: 'var(--red)' } : undefined}>
          {label}
        </div>
        {sub && <div className="cr-sub">{sub}</div>}
      </div>
      <div className="config-action">{action}</div>
    </div>
  )
}

function EditableRow({ label, sub, children }: { label: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="config-row">
      <div className="config-row-copy">
        <div className="cr-label">{label}</div>
        <div className="cr-sub">{sub}</div>
      </div>
      <div className="config-action">{children}</div>
    </div>
  )
}

function ToggleRow({ label, sub, on, onClick }: { label: string; sub: string; on: boolean; onClick: () => void }) {
  return (
    <button type="button" className="config-row config-row-button" onClick={onClick}>
      <div className="config-row-copy">
        <div className="cr-label">{label}</div>
        <div className="cr-sub">{sub}</div>
      </div>
      <div className={`toggle ${on ? 'on' : ''}`} />
    </button>
  )
}
