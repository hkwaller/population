import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'New Game',
  description:
    'Start a new Population game. Host a live multiplayer party, play solo, or set up a same-device round with friends.',
  alternates: { canonical: '/new-game' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
