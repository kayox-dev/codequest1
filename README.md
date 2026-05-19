# CodeQuest Completo

Plataforma gamificada em Next.js + Supabase com cadastro, onboarding, trilhas, missões, XP, progresso e ranking.

## Rodar localmente

Requer Node.js `>=20.9.0`.

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

## Variaveis de ambiente

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-public-key
NEXT_PUBLIC_SITE_URL=https://seu-dominio.com
```

Na Vercel, defina as mesmas variaveis em Project Settings > Environment Variables.

## Supabase

Execute as migrations em ordem em `supabase/migrations`, da `001_codequest_complete.sql` ate a migration mais recente.

Para o catalogo final de trilhas, a migration `011_consolidate_duplicate_tracks.sql` consolida duplicadas e deixa ativas apenas:

- Frontend
- Backend
- Python
- Java
- PHP
- Cybersecurity
- AI Engineer
- Mobile
- DevOps
- Game Development

RLS deve permanecer habilitado para `profiles`, `tracks`, `lessons`, `user_track_progress`, `user_lesson_progress`, `xp_history`, `rankings`, `missions`, `achievements`, `devtags`, `challenges` e tabelas de rewards. A migration `012_harden_profile_visibility.sql` restringe `profiles` ao próprio usuário e usa `rankings` como superfície pública do leaderboard.

## Auth

Em Supabase Authentication > URL Configuration:

- Local Site URL: use o valor de `NEXT_PUBLIC_SITE_URL`
- Local Redirect URL: `${NEXT_PUBLIC_SITE_URL}/auth/callback`
- Producao Site URL: `https://seu-dominio.vercel.app`
- Producao Redirect URL: `https://seu-dominio.vercel.app/auth/callback`

## Checks de deploy

```bash
npm run type-check
npm run lint
npm run build
```

O build usa assets locais em `public/track-art`, sem dependencias de imagens remotas.
