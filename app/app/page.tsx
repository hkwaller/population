import type { Metadata } from 'next'

import { AppHome } from './AppHome'

// The native app's start screen (capacitor.config.ts `server.url`). The website
// keeps `/` as its landing page; this one is a launcher, so keep it out of search.
export const metadata: Metadata = {
  title: 'Play',
  robots: { index: false, follow: false },
  alternates: { canonical: '/' },
}

export default function AppPage() {
  return <AppHome />
}
