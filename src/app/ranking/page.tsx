import { AppShell } from '@/components/layout/AppShell'
import { getPlayerTag } from '@/lib/player-tags'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export default async function Ranking() {
  const s = await createSupabaseServerClient()
  const { data = [] } = await s.from('rankings').select('username,equipped_tag,xp_total,level,streak').order('xp_total', { ascending: false }).limit(20)

  const podium = data.slice(0, 3)
  const rest = data.slice(3)

  return (
    <AppShell>
      <main className="ranking-main">
        <div className="sec-title">Ranking Global</div>

        <div className="podium">
          <PodiumItem rank="2" player={podium[1]} fallbackName="RocketStar" fallbackXp={12450} tone="silver" label="RS" />
          <PodiumItem rank="1" player={podium[0]} fallbackName="CodeKing" fallbackXp={18920} tone="gold" label="CK" />
          <PodiumItem rank="3" player={podium[2]} fallbackName="PixelPro" fallbackXp={9870} tone="bronze" label="PX" />
        </div>

        <div className="rank-list">
          {rest.map((p: any, i: number) => {
            const isMe = i + 4 === 6
            const tag = getPlayerTag(p.equipped_tag)

            return (
              <div key={i} className={`rank-row ${isMe ? 'me' : ''}`}>
                <span className="rank-pos" style={isMe ? { color: 'var(--accent2)' } : undefined}>
                  {i + 4}
                </span>
                <div
                  className="rank-av"
                  style={{
                    background:
                      i % 5 === 0
                        ? 'linear-gradient(135deg,#e74c3c,#c0392b)'
                        : i % 5 === 1
                          ? 'linear-gradient(135deg,#2ecc71,#27ae60)'
                          : i % 5 === 2
                            ? 'linear-gradient(135deg,#f39c12,#e67e22)'
                            : i % 5 === 3
                              ? 'linear-gradient(135deg,#9b59b6,#8e44ad)'
                              : 'linear-gradient(135deg,#1abc9c,#16a085)',
                  }}
                >
                  {(p.username || 'U')[0].toUpperCase()}
                </div>
                <span className="rank-name rank-player-name" style={isMe ? { color: 'var(--accent2)' } : undefined}>
                  <span>{p.username || 'Dev'}</span>
                  {tag && <span className={`rank-tag rarity-${tag.rarity}`}>{tag.icon} {tag.name}</span>}
                  {isMe && <span style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 400 }}> (você)</span>}
                </span>
                <span className="rank-level">Nv. {p.level ?? 1}</span>
                <span className="rank-streak">🔥 {p.streak ?? 0}</span>
                <span className="rank-xp">{p.xp_total ?? 0} XP</span>
              </div>
            )
          })}
        </div>
      </main>
    </AppShell>
  )
}

function PodiumItem({
  rank,
  player,
  fallbackName,
  fallbackXp,
  tone,
  label,
}: {
  rank: string
  player: any
  fallbackName: string
  fallbackXp: number
  tone: 'gold' | 'silver' | 'bronze'
  label: string
}) {
  const name = player?.username || fallbackName
  const xp = player?.xp_total ?? fallbackXp
  const tag = getPlayerTag(player?.equipped_tag)

  return (
    <div className="podium-item">
      <div className={`podium-av ${tone}`} style={{ background: tone === 'gold' ? 'linear-gradient(135deg,var(--accent),#a855f7)' : tone === 'silver' ? 'linear-gradient(135deg,#6a6a9a,#4a4a7a)' : 'linear-gradient(135deg,#5a3a2a,#3a2a1a)' }}>
        {label}
      </div>
      <div className="podium-name">{name}</div>
      {tag && <div className={`podium-tag rarity-${tag.rarity}`}>{tag.icon} {tag.name}</div>}
      <div className="podium-xp">{xp.toLocaleString('pt-BR')} XP</div>
      <div className={`podium-block ${tone === 'gold' ? 'g' : tone === 'silver' ? 's' : 'b'}`}>{rank}</div>
    </div>
  )
}
