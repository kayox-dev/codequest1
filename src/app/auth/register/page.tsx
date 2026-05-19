'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { authService, profileService } from '@/services/auth.service'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateRegister(username: string, email: string, password: string) {
  if (!username.trim()) return 'Informe seu nome de usuário.'
  if (username.trim().length < 3) return 'O nome de usuário precisa ter pelo menos 3 caracteres.'
  if (!email.trim()) return 'Informe seu e-mail.'
  if (!emailRegex.test(email.trim())) return 'Digite um e-mail válido.'
  if (!password) return 'Informe sua senha.'
  if (password.length < 6) return 'A senha precisa ter pelo menos 6 caracteres.'
  return null
}

function friendlySignUpError(message?: string) {
  const text = message?.toLowerCase() ?? ''
  if (text.includes('already registered') || text.includes('already exists') || text.includes('user already registered')) {
    return 'Este e-mail já está cadastrado. Entre na sua conta ou use outro e-mail.'
  }
  if (text.includes('password')) return 'A senha é fraca ou inválida. Use pelo menos 6 caracteres.'
  if (text.includes('email')) return 'Não foi possível validar este e-mail. Confira e tente novamente.'
  return message || 'Não foi possível criar sua conta agora. Tente novamente.'
}

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

    const validationError = validateRegister(u, e, p)
    if (validationError) {
      toast.error(validationError)
      return
    }

    setLoading(true)
    try {
      const username = u.trim()
      const email = e.trim()
      const { data, error } = await authService.signUpWithEmail(email, p, username)

      if (error) {
        toast.error(friendlySignUpError(error.message))
        return
      }

      const user = data.user
      if (!user?.id) {
        toast.error('O Supabase não confirmou a criação do usuário. Tente novamente.')
        return
      }

      const identities = user.identities ?? []
      if (identities.length === 0) {
        toast.error('Este e-mail já está cadastrado. Entre na sua conta ou use outro e-mail.')
        return
      }

      if (data.session) {
        await profileService.updateProfile(user.id, { username, onboarding_completed: false })
        toast.success('Conta criada com sucesso.')
        router.replace('/onboarding')
        router.refresh()
        return
      }

      setOk(true)
      toast.success('Conta criada. Confirme seu e-mail para entrar.')
    } catch (error: any) {
      console.error('[Register] sign up failed', error)
      toast.error(friendlySignUpError(error?.message))
    } finally {
      setLoading(false)
    }
  }

  if (ok) {
    return (
      <AuthLayout title="Conta criada!" subtitle="Confirme seu e-mail para ativar a conta. Depois disso, entre para continuar o onboarding.">
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
        <label className="sr-only" htmlFor="register-username">Nome de usuário</label>
        <input id="register-username" className="input-field" name="register-username" autoComplete="nickname" placeholder="Nome de usuário" value={u} onChange={(event) => setU(event.target.value)} disabled={loading} required />
        <label className="sr-only" htmlFor="register-email">E-mail</label>
        <input id="register-email" className="input-field" name="register-email" autoComplete="email" type="email" placeholder="E-mail" value={e} onChange={(event) => setE(event.target.value)} disabled={loading} required />
        <label className="sr-only" htmlFor="register-password">Senha</label>
        <input id="register-password" className="input-field" name="register-password" autoComplete="new-password" type="password" minLength={6} placeholder="Senha" value={p} onChange={(event) => setP(event.target.value)} disabled={loading} required />
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
