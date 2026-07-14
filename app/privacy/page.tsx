import Link from 'next/link'
import { AnimatedContainer } from '../components/AnimatedContainer'
import { Logo } from '../components/Logo'

export default function PrivacyPage() {
  return (
    <AnimatedContainer>
      <Logo />
      <div className="h-full text-ish-ink p-0 md:p-8">
        <main className="container py-4 md:py-12 mx-auto flex flex-col items-center gap-8 max-w-[800px]">
          <div className="w-full bg-white border-8 border-ish-ink p-8 transform -rotate-1 shadow-[8px_8px_0px_#211812]">
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4 uppercase tracking-tight text-ish-coral">
              Privacy Policy
            </h1>
            <p className="text-base md:text-lg text-ish-ink/60 mb-6">Last updated: April 2025</p>
            <p className="text-lg md:text-xl">
              Ish is made by Amalies Utviklingsfabrikk. This policy explains what data we collect,
              why we collect it, and how we use it. We keep things simple — we only collect what we
              need.
            </p>
          </div>

          <div className="w-full bg-ish-cobalt text-white border-8 border-ish-ink p-8 transform rotate-1 shadow-[8px_8px_0px_#211812]">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-4 uppercase">
              What We Collect
            </h2>
            <ul className="list-disc list-inside text-lg md:text-xl space-y-3">
              <li>
                <span className="font-bold">Account information</span> — if you sign in, we store
                your email address and display name via Clerk (our authentication provider).
              </li>
              <li>
                <span className="font-bold">Game data</span> — answers, scores, and game history
                are stored so you can view your results and highscores.
              </li>
              <li>
                <span className="font-bold">Usage data</span> — we use PostHog to understand how
                the app is used in aggregate. This helps us improve the game.
              </li>
            </ul>
          </div>

          <div className="w-full bg-ish-lime border-8 border-ish-ink p-8 transform -rotate-1 shadow-[8px_8px_0px_#211812]">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-4 uppercase">
              How We Use It
            </h2>
            <ul className="list-disc list-inside text-lg md:text-xl space-y-3">
              <li>To run and display the game correctly</li>
              <li>To show you your scores, highscores, and game history</li>
              <li>To identify and fix bugs and improve the experience</li>
              <li>We do not sell your data to anyone, ever</li>
            </ul>
          </div>

          <div className="w-full bg-white border-8 border-ish-ink p-8 transform rotate-1 shadow-[8px_8px_0px_#211812]">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-4 uppercase">
              Third-Party Services
            </h2>
            <p className="text-lg md:text-xl mb-4">
              Ish uses the following third-party services, each with their own privacy policies:
            </p>
            <ul className="list-disc list-inside text-lg md:text-xl space-y-2">
              <li>
                <a
                  href="https://clerk.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold underline"
                >
                  Clerk
                </a>{' '}
                — authentication and user management
              </li>
              <li>
                <a
                  href="https://supabase.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold underline"
                >
                  Supabase
                </a>{' '}
                — database and backend
              </li>
              <li>
                <a
                  href="https://posthog.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold underline"
                >
                  PostHog
                </a>{' '}
                — product analytics
              </li>
            </ul>
          </div>

          <div className="w-full bg-ish-violet text-white border-8 border-ish-ink p-8 transform -rotate-1 shadow-[8px_8px_0px_#211812]">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-4 uppercase">Your Rights</h2>
            <p className="text-lg md:text-xl mb-4">
              You have the right to access, correct, or delete your personal data. If you want to
              delete your account and all associated data, reach out to us and we&apos;ll take care
              of it promptly.
            </p>
            <p className="text-lg md:text-xl">
              For any privacy-related questions, email us at{' '}
              <a
                href="mailto:hei@amaliesutviklingsfabrikk.no"
                className="font-extrabold underline"
              >
                hei@amaliesutviklingsfabrikk.no
              </a>
              .
            </p>
          </div>

          <div className="w-full bg-ish-sun border-8 border-ish-ink p-8 transform rotate-1 shadow-[8px_8px_0px_#211812]">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-4 uppercase">Changes</h2>
            <p className="text-lg md:text-xl">
              We may update this policy occasionally. When we do, we&apos;ll update the date at the
              top of this page. Continued use of Ish after changes means you accept the updated
              policy.
            </p>
          </div>
        </main>

        <footer className="bg-ish-ink text-white p-6 mt-20">
          <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
            <div className="text-lg md:text-2xl font-bold mb-4 md:mb-0">Ish.</div>
            <nav className="flex flex-wrap justify-center md:justify-end gap-6 text-md md:text-xl">
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
                href="https://amaliesutviklingsfabrikk.no"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xl font-bold hover:underline text-center"
              >
                Created by Amalies Utviklingsfabrikk
              </a>
            </nav>
          </div>
        </footer>
      </div>
    </AnimatedContainer>
  )
}
