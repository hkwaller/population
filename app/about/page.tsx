import Link from 'next/link'
import { AnimatedContainer } from '../components/AnimatedContainer'
import { Logo } from '../components/Logo'

export default function AboutPage() {
  return (
    <AnimatedContainer>
      <Logo />
      <div className="h-full text-ish-ink p-0 md:p-8">
        <main className="container py-4 md:py-12 mx-auto flex flex-col items-center gap-8 max-w-[800px]">
          <div className="w-full bg-white border-8 border-ish-ink p-8 transform -rotate-1 shadow-[8px_8px_0px_#211812]">
            <h1 className="text-3xl md:text-5xl font-extrabold mb-6 uppercase tracking-tight text-ish-coral">
              About Population
            </h1>
            <p className="text-lg md:text-xl mb-4">
              Population is a real-time multiplayer quiz game with a twist — the goal is to score as{' '}
              <span className="font-extrabold">low</span> as possible. Every answer you give earns
              you points, but the closer you are to the correct answer, the fewer points you get.
            </p>
            <p className="text-lg md:text-xl">
              It sounds simple, but when you&apos;re playing with friends and the pressure is on,
              every question becomes a battle of wits, luck, and strategy.
            </p>
          </div>

          <div className="w-full bg-ish-cobalt text-white border-8 border-ish-ink p-8 transform rotate-1 shadow-[8px_8px_0px_#211812]">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-4 uppercase">How It Works</h2>
            <ul className="list-disc list-inside text-lg md:text-xl space-y-2">
              <li>One player creates a game and shares the link</li>
              <li>Everyone joins and answers questions using a slider</li>
              <li>Points are based on distance from the correct answer</li>
              <li>The player with the fewest points at the end wins</li>
              <li>Play solo or form teams — your call</li>
            </ul>
          </div>

          <div className="w-full bg-ish-lime border-8 border-ish-ink p-8 transform -rotate-1 shadow-[8px_8px_0px_#211812]">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-4 uppercase">The Categories</h2>
            <p className="text-lg md:text-xl mb-4">
              Population has a large and growing question bank spanning categories like TV &amp; Movies,
              Animals, History, Science, Geography, Sports, and more.
            </p>
            <p className="text-lg md:text-xl">
              Pro users can even create their own custom categories and questions — perfect for
              themed game nights or trivia nights with a personal touch.
            </p>
          </div>

          <div className="w-full bg-ish-violet text-white border-8 border-ish-ink p-8 transform rotate-1 shadow-[8px_8px_0px_#211812]">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-4 uppercase">Who Made This?</h2>
            <p className="text-lg md:text-xl mb-4">
              Population was built by{' '}
              <a
                href="https://amaliesutviklingsfabrikk.no"
                target="_blank"
                rel="noopener noreferrer"
                className="font-extrabold underline"
              >
                Amalies Utviklingsfabrikk
              </a>
              . We build fun, useful, and slightly weird things for the web.
            </p>
            <p className="text-lg md:text-xl">
              Have an idea or want to collaborate? Head over to the{' '}
              <Link href="/contact" className="font-extrabold underline">
                contact page
              </Link>
              .
            </p>
          </div>
        </main>

        <footer className="bg-ish-ink text-white p-6 mt-20">
          <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
            <div className="text-lg md:text-2xl font-bold mb-4 md:mb-0">Population.</div>
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
