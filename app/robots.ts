import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Per-session / non-content routes and internals. `/_next/` is left
        // crawlable on purpose — bots need render-critical CSS/JS.
        disallow: ['/api/', '/admin/', '/game/', '/setup/', '/join/', '/profile'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
