import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Gabarito } from 'next/font/google'
import { CSPostHogProvider } from './providers'
import { Toaster } from '@/components/ui/toaster'
import { ClerkProvider } from '@clerk/nextjs'
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from '@/lib/site'
import { JsonLd } from './components/JsonLd'

const gabarito = Gabarito({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-gabarito',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Population - how well do you know the world?',
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: 'Population - how well do you know the world?',
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Population - how well do you know the world?',
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${gabarito.variable} font-sans`}>
        <JsonLd
          data={[
            {
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: SITE_NAME,
              url: SITE_URL,
              description: SITE_DESCRIPTION,
            },
            {
              '@context': 'https://schema.org',
              '@type': 'VideoGame',
              name: SITE_NAME,
              url: SITE_URL,
              description: SITE_DESCRIPTION,
              genre: ['Trivia', 'Geography', 'Educational'],
              gamePlatform: 'Web browser',
              applicationCategory: 'GameApplication',
              playMode: ['MultiPlayer', 'SinglePlayer'],
              operatingSystem: 'Any',
            },
          ]}
        />
        <ClerkProvider>
          {/* <CSPostHogProvider> */}
          {children}
          {/* </CSPostHogProvider> */}
          <Toaster />
        </ClerkProvider>
      </body>
    </html>
  )
}
