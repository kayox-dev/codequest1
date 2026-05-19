'use client'

import { useMemo, useState } from 'react'
import { useAppStore } from '@/store'

type Msg = { from: 'ia' | 'user'; text: string }

export function AiAssistant() {
  const { aiOpen, toggleAi, profile } = useAppStore()
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      from: 'ia',
      text:
        'Olá, eu sou o Jarvis do CodeQuest. Posso explicar a próxima lição, sugerir o que fazer agora e ajudar a destravar fases.',
    },
  ])
  const [txt, setTxt] = useState('')

  const suggestions = useMemo(
    () => ['Como avanço?', 'Onde vejo meu progresso?', 'Dica para a próxima lição'],
    [],
  )

  if (!aiOpen) return null

  function reply(input: string) {
    const q = input.toLowerCase()
    if (q.includes('progresso') || q.includes('xp')) {
      return `Você está no nível ${profile?.level ?? 1} com ${profile?.xp_total ?? 0} XP. Continue a trilha ativa para subir rápido.`
    }
    if (q.includes('trilha') || q.includes('fase') || q.includes('lição')) {
      return 'Abra a trilha atual, complete a fase ativa e a próxima ficará disponível automaticamente.'
    }
    if (q.includes('perfil') || q.includes('username')) {
      return 'Finalize o perfil com nome de usuário, avatar, objetivo e linguagens favoritas para personalizar a jornada.'
    }
    if (q.includes('google')) {
      return 'Se o Google OAuth não abrir, confira o provider no Supabase e o redirect URI do callback do projeto.'
    }
    return 'Leia o objetivo da fase, teste um passo por vez e confirme se o código bate com o pedido. Se quiser, eu posso te dar uma dica mais específica.'
  }

  function send(message = txt) {
    const cleaned = message.trim()
    if (!cleaned) return
    setMsgs((m) => [...m, { from: 'user', text: cleaned }, { from: 'ia', text: reply(cleaned) }])
    setTxt('')
  }

  return (
    <div className="jarvis-panel">
      <div className="jarvis-head">
        <div>
          <div className="font-display text-sm font-bold text-gradient">🤖 Jarvis CodeQuest</div>
          <div className="text-[11px] text-t3">assistente futurista</div>
        </div>
        <button onClick={toggleAi} className="text-t3 hover:text-white text-lg leading-none">
          ✕
        </button>
      </div>
      <div className="jarvis-body">
        <div className="jarvis-msgs">
          {msgs.map((m, i) => (
            <div key={i} className={`jarvis-msg ${m.from}`}>
              {m.text}
            </div>
          ))}
        </div>
        <div className="jarvis-suggestions">
          {suggestions.map((s) => (
            <button key={s} className="jarvis-suggestion" onClick={() => send(s)}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <input
            className="input-field py-2 text-sm"
            value={txt}
            onChange={(e) => setTxt(e.target.value)}
            placeholder="Pergunte algo..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') send()
            }}
          />
          <button className="btn-primary py-2" onClick={() => send()}>
            Enviar
          </button>
        </div>
      </div>
    </div>
  )
}
