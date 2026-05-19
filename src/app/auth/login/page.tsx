'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { authService } from '@/services/auth.service'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await authService.signInWithEmail(email, password)
    setLoading(false)
    if (error) toast.error(error.message)
    else router.push('/dashboard')
  }

  return (
    <AuthLayout title="Entrar" subtitle="Continue sua jornada">
      <div className="space-y-3 mb-5">
        <button type="button" className="btn-secondary w-full" onClick={() => authService.signInWithGoogle()}>
          Entrar com Google
        </button>
        <button type="button" className="btn-secondary w-full" onClick={() => authService.signInWithGitHub()}>
          Entrar com GitHub
        </button>
      </div>
      <div className="auth-divider">
        <span>ou use email</span>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <input className="input-field" name="login-email" autoComplete="email" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="input-field" name="login-password" autoComplete="current-password" type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required />
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
