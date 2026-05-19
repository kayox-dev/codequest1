import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'

const adminLinks = [
  { title: 'Trilhas', desc: 'Revisar catalogo final e acessar roadmaps ativos.', href: '/escolha-trilha' },
  { title: 'Missões', desc: 'Validar recompensas, XP e progresso diário.', href: '/missoes' },
  { title: 'Desafios', desc: 'Testar desafios praticos e boss challenges.', href: '/desafios' },
  { title: 'Ranking', desc: 'Conferir dados publicos de leaderboard.', href: '/ranking' },
]

export default function Admin() {
  return (
    <AppShell>
      <main className="p-6">
        <h1 className="font-display text-3xl font-extrabold">Admin</h1>
        <p className="text-t-2 mt-2">Painel operacional para validar as areas principais antes do deploy.</p>

        <div className="grid md:grid-cols-4 gap-4 mt-6">
          {adminLinks.map((item) => (
            <Link className="card p-5 block hover:border-accent/60 transition" href={item.href} key={item.href}>
              <b>{item.title}</b>
              <span className="block text-sm text-t-2 mt-2">{item.desc}</span>
            </Link>
          ))}
        </div>
      </main>
    </AppShell>
  )
}
