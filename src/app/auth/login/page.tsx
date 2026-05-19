'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { authService, getPostLoginRedirect, profileService } from '@/services/auth.service'

function friendlyAuthError(message?: string) {
  const text = message?.toLowerCase() ?? ''
  if (text.includes('invalid login credentials') || text.includes('invalid credentials')) {
    return 'E-mail ou senha incorretos. Confira os dados e tente novamente.'
  }
  if (text.includes('email not confirmed')) {
    return 'Confirme seu e-mail antes de entrar.'
  }
  return message || 'Não foi possível entrar agora. Tente novamente.'
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return

    setLoading(true)

    try {
      const { data, error } = await authService.signInWithEmail(email.trim(), password)

      if (error) {
        toast.error(friendlyAuthError(error.message))
        return
      }

      const user = data.user ?? data.session?.user
      if (!user) {
        toast.error('Login recebido, mas a sessão não foi criada. Tente novamente.')
        return
      }

      const profile = await profileService.getProfile(user.id)
      const target = getPostLoginRedirect(profile)

      toast.success('Login realizado com sucesso.')
      router.replace(target)
      router.refresh()
    } catch (error: any) {
      console.error('[Login] sign in failed', error)
      toast.error(friendlyAuthError(error?.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Entrar" subtitle="Continue sua jornada">
      <div className="space-y-3 mb-5">
        <button type="button" className="btn-secondary w-full" onClick={() => authService.signInWithGoogle()} disabled={loading}>
          Entrar com Google
        </button>
        <button type="button" className="btn-secondary w-full" onClick={() => authService.signInWithGitHub()} disabled={loading}>
          Entrar com GitHub
        </button>
      </div>
      <div className="auth-divider">
        <span>ou use e-mail</span>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <input className="input-field" name="login-email" autoComplete="email" type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} required />
        <input className="input-field" name="login-password" autoComplete="current-password" type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} required />
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <p className="text-center text-t-3 text-sm mt-6">
        Não tem conta? <Link className="text-accent-2" href="/auth/register">Criar conta</Link>
      </p>
    </AuthLayout>
  )
}
