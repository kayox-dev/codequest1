'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { authService } from '@/services/auth.service'

export default function Register() {
  const [u, setU] = useState('')
  const [e, setE] = useState('')
  const [p, setP] = useState('')
  const [ok, setOk] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function submit(ev: React.FormEvent) {
    ev.preventDefault()
    if (loading) return

    setLoading(true)
    try {
      const { data, error } = await authService.signUpWithEmail(e.trim(), p, u.trim())
      if (error) {
        toast.error(error.message)
        return
      }

      if (data.session) {
        router.replace('/onboarding')
        router.refresh()
      } else {
        setOk(true)
      }
    } finally {
      setLoading(false)
    }
  }

  if (ok) {
    return (
      <AuthLayout title="Conta criada!" subtitle="Agora confirme pelo e-mail ou entre se a confirmação estiver desativada">
        <Link className="btn-primary block text-center" href="/auth/login">
          Ir para login
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Criar conta" subtitle="Todo novo usuário começa zerado">
      <div className="space-y-3 mb-5">
        <button type="button" className="btn-secondary w-full" onClick={() => authService.signInWithGoogle()} disabled={loading}>
          Continuar com Google
        </button>
        <button type="button" className="btn-secondary w-full" onClick={() => authService.signInWithGitHub()} disabled={loading}>
          Continuar com GitHub
        </button>
      </div>
      <div className="auth-divider">
        <span>ou use e-mail</span>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <input className="input-field" name="register-username" autoComplete="nickname" placeholder="Nome de usuário" value={u} onChange={(e) => setU(e.target.value)} disabled={loading} required />
        <input className="input-field" name="register-email" autoComplete="email" type="email" placeholder="E-mail" value={e} onChange={(ev) => setE(ev.target.value)} disabled={loading} required />
        <input className="input-field" name="register-password" autoComplete="new-password" type="password" minLength={6} placeholder="Senha" value={p} onChange={(e) => setP(e.target.value)} disabled={loading} required />
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? 'Criando conta...' : 'Criar conta zerada'}
        </button>
      </form>
      <p className="text-center text-t-3 text-sm mt-6">
        Já tem conta? <Link className="text-accent-2" href="/auth/login">Entrar</Link>
      </p>
    </AuthLayout>
  )
}
