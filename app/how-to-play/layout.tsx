import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'How to Play',
  description:
    'Learn how Population works: flags, capitals, borders, sliders and pin-the-map. The closer your guess, the more points you score.',
  alternates: { canonical: '/how-to-play' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
