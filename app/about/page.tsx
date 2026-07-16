'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import CountUp from 'react-countup'

import stats from '../database/stats.json'
import { categories } from '@/lib/utils'
import { PopShell } from '../components/pop/PopShell'
import { PopHeader, PopAuth } from '../components/pop/PopHeader'
import { PopButton } from '../components/pop/PopButton'
import { POP, POP_SPRING } from '../components/pop/theme'

const HOW_IT_WORKS = [
  { n: 1, bg: POP.coral, text: 'One player hosts a game and shares the code or QR' },
  { n: 2, bg: POP.cobalt, text: 'Everyone answers: flags, capitals, borders, sliders, map pins' },
  { n: 3, bg: POP.grape, text: 'The closer your guess, the more points you bag' },
  { n: 4, bg: POP.mint, text: 'Highest score at the end takes the crown 👑' },
]

export default function AboutPage() {
  const totalQuestions = (stats as Record<string, number>).total ?? 0

  return (
    <PopShell bg={POP.grape}>
      <PopHeader logoTextColor={POP.grape} right={<PopAuth tone="light" />} />

      <main className="mx-auto flex max-w-3xl flex-col px-5 pb-28 pt-6 md:pt-10">
        <motion.h1
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, rotate: -1.5 }}
          transition={POP_SPRING}
          className="mb-4 text-center font-black tracking-[-0.02em] text-white"
          style={{ fontSize: 'clamp(48px, 9vw, 80px)' }}
        >
          About Population
        </motion.h1>
        <p className="mx-auto mb-10 max-w-xl text-center text-xl font-bold text-white/90">
          Flags, capitals, borders and a few billion people. Guess the world - the closest guess
          scores the most, and the highest total wins.
        </p>

        <div className="flex flex-col gap-6">
          {/* The twist */}
          <motion.section
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, rotate: -1 }}
            transition={{ ...POP_SPRING, delay: 0.05 }}
            className="rounded-card bg-white p-7 shadow-pop-card"
          >
            <h2 className="mb-3 text-3xl font-black text-pop-ink">Get close, score big</h2>
            <p className="text-lg font-bold leading-snug text-pop-ink/75">
              Population is a real-time multiplayer guessing game. Every question is worth up to
              1,000 points, and the nearer you land to the real answer, the more you score. Nail it
              dead-on for a bullseye. When you&apos;re playing with friends and the pressure is on,
              every question turns into a battle of wits, luck, and gut instinct.
            </p>
          </motion.section>

          {/* How it works */}
          <motion.section
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, rotate: 1 }}
            transition={{ ...POP_SPRING, delay: 0.1 }}
            className="rounded-card border-4 border-white p-7"
            style={{ background: POP.cobalt }}
          >
            <h2 className="mb-5 text-3xl font-black text-white">How it works</h2>
            <ul className="flex flex-col gap-4">
              {HOW_IT_WORKS.map((s, i) => (
                <li key={s.n} className="flex items-center gap-4">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[22px] font-black text-white shadow-pop-sm"
                    style={{ background: s.bg, rotate: `${i % 2 === 0 ? -4 : 4}deg` }}
                  >
                    {s.n}
                  </span>
                  <span className="text-[19px] font-bold text-white/95">{s.text}</span>
                </li>
              ))}
            </ul>
          </motion.section>

          {/* The categories */}
          <motion.section
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, rotate: -1 }}
            transition={{ ...POP_SPRING, delay: 0.15 }}
            className="rounded-card p-7 shadow-pop-card"
            style={{ background: POP.sunshine }}
          >
            <h2 className="mb-3 text-3xl font-black text-pop-ink">The categories</h2>
            <p className="mb-5 text-lg font-bold leading-snug text-pop-ink/80">
              A growing bank of{' '}
              <span className="font-black">
                <CountUp end={totalQuestions} duration={1.2} separator="," />
              </span>{' '}
              geography questions across {categories.length} categories - mix and match whichever
              you like when you build a game.
            </p>
            <div className="flex flex-wrap gap-2.5">
              {categories.map((c) => (
                <span
                  key={c.id}
                  className="rounded-pill border-2 border-pop-ink/15 bg-white px-4 py-2 text-base font-black text-pop-ink"
                >
                  {c.name}
                </span>
              ))}
            </div>
          </motion.section>

          {/* Who made this */}
          <motion.section
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, rotate: 1 }}
            transition={{ ...POP_SPRING, delay: 0.2 }}
            className="rounded-card bg-pop-ink p-7"
          >
            <h2 className="mb-3 text-3xl font-black text-white">Who made this?</h2>
            <p className="text-lg font-bold leading-snug text-white/80">
              Population was built by{' '}
              <a
                href="https://amaliesutviklingsfabrikk.no"
                target="_blank"
                rel="noopener noreferrer"
                className="font-black text-white underline"
              >
                Amalies Utviklingsfabrikk
              </a>
              . We build fun, useful, and slightly weird things for the web. Got an idea or want to
              collaborate? Head to the{' '}
              <Link href="/contact" className="font-black text-white underline">
                contact page
              </Link>
              .
            </p>
          </motion.section>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <PopButton href="/new-game" variant="secondary" size="lg" rotate={-1}>
            Start a party
          </PopButton>
          <PopButton href="/how-to-play" variant="ghostLight" size="lg" rotate={1}>
            How to play
          </PopButton>
        </div>
      </main>
    </PopShell>
  )
}
