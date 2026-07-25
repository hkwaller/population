import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Go Ad-Free',
  description: 'Remove ads from Population with a day pass or subscription and support the game.',
  alternates: { canonical: '/go-ad-free' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
