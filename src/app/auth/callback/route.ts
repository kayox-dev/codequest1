import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/auth/login', url.origin))
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(new URL('/auth/login', url.origin))
  }

  const user = data.user
  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', url.origin))
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('user_id', user.id)
    .maybeSingle()

  const target = profile?.onboarding_completed ? '/dashboard' : '/onboarding'

  return NextResponse.redirect(new URL(target, url.origin))
}
