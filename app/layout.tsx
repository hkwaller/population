import type { Metadata } from 'next'
import './globals.css'
import { Gabarito } from 'next/font/google'
import { CSPostHogProvider } from './providers'
import { Toaster } from '@/components/ui/toaster'
import { ClerkProvider } from '@clerk/nextjs'

const gabarito = Gabarito({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-gabarito',
})

export const metadata: Metadata = {
  title: 'Population - how well do you know the world?',
  description: 'Flags, capitals, borders and a few billion people. Guess the world - closest wins.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${gabarito.variable} font-sans`}>
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
