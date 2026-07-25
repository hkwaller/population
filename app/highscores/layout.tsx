import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Highscores',
  description: 'See the top Population players and where you rank against the world.',
  alternates: { canonical: '/highscores' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
