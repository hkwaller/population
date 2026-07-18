'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import CountUp from 'react-countup'

import stats from './database/stats.json'
import { categories } from '@/lib/utils'
import { PopShell } from './components/pop/PopShell'
import { PopHeader, PopAuth } from './components/pop/PopHeader'
import { PopButton } from './components/pop/PopButton'
import { POP, POP_SPRING } from './components/pop/theme'
import { AdsterraBanner } from './components/AdsterraBanner'

const STEPS = [
  { n: 1, bg: POP.coral, text: 'Host starts a party, friends scan the code' },
  { n: 2, bg: POP.cobalt, text: 'Flags, capitals, borders, sliders, pin-the-map' },
  { n: 3, bg: POP.grape, text: 'The closer your guess, the more points you bag' },
  { n: 4, bg: POP.mint, text: 'Highest score takes the crown 👑' },
]

export default function StartPage() {
  const totalQuestions = (stats as Record<string, number>).total ?? 0

  return (
    <PopShell bg={POP.coral} chips>
      <PopHeader logoTextColor={POP.coral} right={<PopAuth tone="light" />} />

      <main className="mx-auto flex max-w-5xl flex-col items-center px-5 pb-24 pt-8 text-center md:pt-14">
        <motion.h1
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, rotate: -2 }}
          transition={POP_SPRING}
          className="pop-textshadow font-black leading-[0.85] tracking-[-0.03em] text-white"
          style={{ fontSize: 'clamp(52px, 13vw, 132px)' }}
        >
          Population
        </motion.h1>

        <p className="mx-auto mt-6 max-w-[620px] text-xl font-bold text-white/90 md:text-[28px] md:leading-tight">
          Flags, capitals, borders and a few billion people. Guess the world - closest wins.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <PopButton
            href="/new-game"
            variant="secondary"
            size="lg"
            rotate={-1}
            className="text-pop-coral"
          >
            Start a party
          </PopButton>
          <PopButton href="/join" variant="primary" size="lg" rotate={1}>
            I have a code
          </PopButton>
        </div>
        <div className="mt-4">
          <PopButton href="/daily" variant="ghostLight" size="lg" rotate={-1}>
            🗓️ Play today&apos;s daily
          </PopButton>
        </div>

        <div className="mt-16 grid w-full max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
          {/* How it works */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, rotate: -1.5 }}
            transition={{ ...POP_SPRING, delay: 0.1 }}
            className="rounded-card bg-white p-7 text-left shadow-pop-card"
          >
            <h2 className="mb-5 text-3xl font-black text-pop-ink">How it works</h2>
            <ul className="flex flex-col gap-4">
              {STEPS.map((s, i) => (
                <li key={s.n} className="flex items-center gap-4">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[22px] font-black text-white"
                    style={{ background: s.bg, rotate: `${i % 2 === 0 ? -4 : 4}deg` }}
                  >
                    {s.n}
                  </span>
                  <span className="text-[19px] font-bold text-pop-ink">{s.text}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* The numbers */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, rotate: 1.5 }}
            transition={{ ...POP_SPRING, delay: 0.18 }}
            className="rounded-card border-4 border-white p-7 text-left"
            style={{ background: POP.sunshine }}
          >
            <h2 className="mb-5 text-3xl font-black text-pop-ink">The numbers</h2>
            <div className="flex flex-col gap-4">
              <Stat
                value={<CountUp end={totalQuestions} duration={1.2} separator="," />}
                label="questions and counting"
              />
              <Stat
                value={<CountUp end={categories.length} duration={1} />}
                label="categories to mix"
              />
            </div>
            <p className="mt-6 text-[17px] font-bold text-pop-ink/70">
              Live scoring · play on any device · rematch in one tap
            </p>
          </motion.div>
        </div>
      </main>

      <div className="px-6 pb-10">
        <AdsterraBanner />
      </div>

      <Footer />
    </PopShell>
  )
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-[44px] font-black leading-none text-pop-ink">{value}</span>
      <span className="text-[19px] font-bold text-pop-ink/70">{label}</span>
    </div>
  )
}

function Footer() {
  return (
    <footer className="w-full bg-pop-ink px-6 py-7 md:px-12">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 md:flex-row">
        <span
          className="rounded-[14px] bg-white px-3 py-1.5 text-lg font-black"
          style={{ color: POP.coral, rotate: '-3deg' }}
        >
          Population
        </span>
        <nav className="flex flex-wrap items-center justify-center gap-6 text-[17px] font-bold text-white/70">
          <Link href="/about" className="hover:text-white">
            About
          </Link>
          <Link href="/contact" className="hover:text-white">
            Contact
          </Link>
          <Link href="/privacy" className="hover:text-white">
            Privacy
          </Link>
          <a
            href="https://amaliesutviklingsfabrikk.no"
            target="_blank"
            rel="noopener noreferrer"
            className="font-extrabold text-white hover:underline"
          >
            Made by Amalies Utviklingsfabrikk ✌
          </a>
        </nav>
      </div>
    </footer>
  )
}
