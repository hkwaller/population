import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About',
  description: 'About Population - the real-time geography guessing game where the closest guess wins.',
  alternates: { canonical: '/about' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
