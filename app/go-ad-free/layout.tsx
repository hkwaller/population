import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ADS_ENABLED } from '@/lib/ads'

export const metadata: Metadata = {
  title: 'Go Ad-Free',
  description: 'Remove ads from Population with a day pass or subscription and support the game.',
  alternates: { canonical: '/go-ad-free' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  // No ads, nothing to remove.
  if (!ADS_ENABLED) notFound()
  return children
}
