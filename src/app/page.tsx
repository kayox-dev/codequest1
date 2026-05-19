import Link from 'next/link'

const tracks = ['Frontend', 'Backend', 'Python', 'Java', 'PHP', 'Cybersecurity', 'AI Engineer', 'Mobile']
const icons = ['FE', 'BE', 'PY', 'JV', 'PHP', 'SEC', 'AI', 'APP']

export default function Home() {
  return (
    <main className="min-h-screen bg-bg-base bg-grid">
      <section className="relative overflow-hidden px-6 py-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,63,255,.25),transparent_65%)]" />
        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex px-4 py-2 rounded-full bg-accent/15 border border-accent/30 text-accent-2 text-sm font-bold mb-5">
              Plataforma gamificada para devs
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-extrabold leading-tight">
              Aprenda código em modo <span className="text-gradient">quest</span>
            </h1>
            <p className="text-t-2 text-lg mt-5 max-w-xl">
              Explore a plataforma sem login. Para jogar lições, ganhar XP e salvar progresso, crie sua conta zerada e escolha uma trilha.
            </p>
            <div className="flex gap-3 mt-8">
              <Link className="btn-primary" href="/auth/register">
                Começar grátis
              </Link>
              <Link className="btn-secondary" href="/dashboard">
                Ver preview
              </Link>
            </div>
          </div>
          <div className="glass rounded-3xl p-6 animate-float">
            <div className="grid grid-cols-2 gap-3">
              {tracks.map((track, index) => (
                <div key={track} className="card p-4">
                  <div className="text-3xl mb-3">{icons[index]}</div>
                  <b>{track}</b>
                  <div className="text-t-3 text-xs mt-1">0% para novos usuários</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
