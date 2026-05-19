import Link from 'next/link'

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <main className="auth-shell bg-grid">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,63,255,.2),transparent_60%)]" />
      <section className="relative z-10 w-full max-w-md auth-card">
        <Link href="/" className="flex items-center justify-center gap-3 mb-8">
          <span className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center">🎮</span>
          <b className="font-display text-xl">CodeQuest</b>
        </Link>
        <h1 className="font-display text-3xl font-extrabold text-center">{title}</h1>
        <p className="text-t-2 text-center text-sm mt-2 mb-7">{subtitle}</p>
        {children}
      </section>
    </main>
  )
}
