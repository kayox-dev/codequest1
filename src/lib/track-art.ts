import type { Track } from '@/types'
import { resolveTrackSlug } from '@/services/track.service'

const TRACK_ART: Record<string, string> = {
  frontend: '/track-art/frontend.svg',
  backend: '/track-art/backend.svg',
  python: '/track-art/python.svg',
  java: '/track-art/java.svg',
  php: '/track-art/php.svg',
  cybersecurity: '/track-art/cybersecurity.svg',
  'ai-engineer': '/track-art/ai-engineer.svg',
  mobile: '/track-art/mobile.svg',
  devops: '/track-art/devops.svg',
  'game-development': '/track-art/game-development.svg',
}

export function getTrackArt(track: Pick<Track, 'slug' | 'image_url'> | null | undefined) {
  if (!track) return TRACK_ART.frontend
  const safeImageUrl = track.image_url?.startsWith('/') ? track.image_url : null
  return safeImageUrl || TRACK_ART[resolveTrackSlug(track.slug)] || TRACK_ART.frontend
}
