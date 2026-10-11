import Link from 'next/link'
import type { Metadata } from 'next'
import { AnimatedContainer } from '../components/AnimatedContainer'
import { Logo } from '../components/Logo'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with the team behind Population.',
  alternates: { canonical: '/contact' },
}

export default function ContactPage() {
  return (
    <AnimatedContainer>
      <Logo />
      <div className="h-full text-ish-ink p-0 md:p-6 md:p-8">
        <main className="container py-4 md:py-12 mx-auto flex flex-col items-center gap-6 md:p-8 max-w-[800px]">
          <div className="w-full bg-white rounded-card p-6 md:p-8 transform shadow-pop-card">
            <h1 className="text-3xl md:text-5xl font-extrabold mb-6  tracking-tight text-pop-ink">
              Get In Touch
            </h1>
            <p className="text-lg md:text-xl mb-4">
              Got a question, found a bug, or just want to say hi? We&apos;d love to hear from you.
            </p>
            <p className="text-lg md:text-xl">
              Population is made by{' '}
              <a
                href="https://playam.app"
                target="_blank"
                rel="noopener noreferrer"
                className="font-extrabold underline"
              >
                Amalies Utviklingsfabrikk
              </a>
              . Drop us a line and we&apos;ll get back to you as soon as we can.
            </p>
          </div>

          <div className="w-full bg-ish-sun rounded-card p-6 md:p-8 transform shadow-pop-card">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-6 ">Email Us</h2>
            <a
              href="mailto:hei@amaliesutviklingsfabrikk.no"
              className="inline-block bg-ish-ink text-white text-base sm:text-xl font-extrabold py-4 px-4 rounded-xl transform hover:rotate-0 transition-transform shadow-pop-card"
            >
              hei@amaliesutviklingsfabrikk.no
            </a>
          </div>

          <div className="w-full bg-ish-cobalt text-white rounded-card p-6 md:p-8 transform shadow-pop-card">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-4 ">Reporting a Problem?</h2>
            <p className="text-lg md:text-xl mb-4">
              If you&apos;ve spotted a question that seems wrong or inappropriate, you can report it
              directly from inside the game while playing.
            </p>
            <p className="text-lg md:text-xl">
              For anything else - bugs, feature ideas, or general feedback - email us and we&apos;ll
              look into it.
            </p>
          </div>

          <div className="w-full bg-ish-mint rounded-card p-6 md:p-8 transform shadow-pop-card">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-4 ">Visit Us Online</h2>
            <p className="text-lg md:text-xl mb-4">
              Check out our other projects and work at{' '}
              <a
                href="https://playam.app"
                target="_blank"
                rel="noopener noreferrer"
                className="font-extrabold underline"
              >
                amaliesutviklingsfabrikk.no
              </a>
              .
            </p>
          </div>
        </main>

        <footer className="bg-ish-ink text-white p-6 mt-20">
          <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
            <div className="text-lg md:text-2xl font-bold mb-4 md:mb-0">Population.</div>
            <nav className="flex flex-wrap justify-center md:justify-end gap-6 text-base md:text-xl">
              <Link href="/about" className="text-xl hover:underline">
                About
              </Link>
              <Link href="/contact" className="text-xl hover:underline">
                Contact
              </Link>
              <Link href="/privacy" className="text-xl hover:underline">
                Privacy Policy
              </Link>
              <a
                href="https://playam.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xl font-bold hover:underline text-center"
              >
                Made by Amalies Utviklingsfabrikk
              </a>
            </nav>
          </div>
        </footer>
      </div>
    </AnimatedContainer>
  )
}
