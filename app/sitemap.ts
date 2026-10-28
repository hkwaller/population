import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// Public, indexable routes. Game/room/setup/join routes are per-session and
// intentionally excluded - they hold no stable, crawlable content.
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '',
    '/how-to-play',
    '/daily',
    '/highscores',
    '/new-game',
    '/about',
    '/contact',
    '/privacy', '/terms',
  ]

  return routes.map((path) => ({
    url: `${SITE_URL}${path}`,
  }))
}
