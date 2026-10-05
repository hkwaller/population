import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { App } from '@capacitor/app'

import geoQuestions from '@/app/database/geo-questions.json'
import type { TQuestion } from '@/app/types'
import { DailyRound, type Attempt } from '@/app/components/daily/DailyRound'
import { PopShell } from '@/app/components/pop/PopShell'
import { PopButton } from '@/app/components/pop/PopButton'
import { POP } from '@/app/components/pop/theme'
import { pickDaily, DAILY_SIZE } from '@/lib/daily'
import { MAX_SCORE, toLargestFirstRank } from '@/lib/utils'
import { isNativeApp } from '@/lib/native'

import { onNavigate } from './shims/nav'

declare global {
  interface Window {
    APP_URL?: string
  }
}

/**
 * server.url as of the last build (app-url.js, from capacitor.config.ts). The
 * shell opens any URL outside it in Safari, so this is where "back online" goes.
 */
export const APP_URL = (window.APP_URL || 'https://population.playam.app/app').replace(/\/$/, '')
const APP_ORIGIN = new URL(APP_URL).origin

/** Back to the live app: its home, or a specific page (a universal link). */
export function goOnline(path?: string) {
  window.location.replace(path && path !== '/' ? APP_ORIGIN + path : APP_URL)
}

/**
 * Can the site be reached right now? Navigating blind fails straight back to
 * this page (Capacitor's errorPath), which looks like the button did nothing,
 * so check first. An opaque no-cors response is enough to know it answered.
 */
export async function siteReachable(timeoutMs = 6000): Promise<boolean> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    await fetch(`${APP_URL}?ping=${Date.now()}`, { mode: 'no-cors', cache: 'no-store', signal: ctrl.signal })
    return true
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

/**
 * goOnline for the automatic checks, at most once per 20 seconds. If the ping
 * answers but the page itself still fails to load, Capacitor lands back here,
 * and without the cap the two would bounce forever. A tap on "Try again" is
 * never capped.
 */
const AUTO_KEY = 'population-offline-auto'
function autoGoOnline() {
  try {
    const last = Number(sessionStorage.getItem(AUTO_KEY) || 0)
    if (Date.now() - last < 20_000) return
    sessionStorage.setItem(AUTO_KEY, String(Date.now()))
  } catch {
    // No sessionStorage: go anyway, the `online` event fires rarely.
  }
  goOnline()
}

/**
 * The practice pool: the whole bundled bank, every question type. Flags and
 * the world geometry the prompts and maps load are copied into native/www
 * (vite.config.ts), so nothing here needs the network.
 */
const POOL = (geoQuestions as unknown as TQuestion[]).map((q) => (q.type === 'rank' ? toLargestFirstRank(q) : q))

/** A fresh practice set: the daily's picker (category mix, easy to hard) with a random seed. */
function practiceSet(): { questions: TQuestion[]; key: string } {
  const key = `practice-${Date.now()}-${Math.random()}`
  return { questions: pickDaily(POOL, key, DAILY_SIZE), key }
}

type Screen =
  | { name: 'home' }
  | { name: 'round'; questions: TQuestion[]; key: string }
  | { name: 'result'; total: number; max: number }

/**
 * The app's offline screen (Capacitor's errorPath). Parties, the daily and
 * stats need the server, but a practice round is pure client logic over the
 * bundled question bank, so it plays here with the same components as the
 * daily. Nothing is saved: no streak, no stats, no Supabase.
 */
export function OfflineApp() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' })

  useEffect(() => onNavigate(() => setScreen({ name: 'home' })), [])

  // Back online while nobody is mid-round: go back to the real app. Checked on
  // load, on the `online` event and whenever the app comes back to the
  // foreground (airplane mode is switched off in Control Center, outside the app).
  useEffect(() => {
    if (screen.name !== 'home') return
    const check = () => void siteReachable().then((ok) => ok && autoGoOnline())
    check()
    window.addEventListener('online', check)
    const resume = isNativeApp() ? App.addListener('resume', check) : null
    return () => {
      window.removeEventListener('online', check)
      void resume?.then((h) => h.remove())
    }
  }, [screen.name])

  const play = () => setScreen({ name: 'round', ...practiceSet() })
  const home = () => setScreen({ name: 'home' })

  if (screen.name === 'round') {
    return (
      <DailyRound
        key={screen.key}
        questions={screen.questions}
        label="Practice"
        logo={<Tag color={POP.cobalt} />}
        onFinish={(attempts: Attempt[]) =>
          setScreen({
            name: 'result',
            total: attempts.reduce((s, a) => s + a.score, 0),
            max: screen.questions.length * MAX_SCORE,
          })
        }
      />
    )
  }
  if (screen.name === 'result') {
    return <PracticeResult total={screen.total} max={screen.max} onAgain={play} onHome={home} />
  }
  return <OfflineHome onPlay={play} />
}

/** The tilted "Population" tag (PopLogo without the link: there is nowhere to go offline). */
function Tag({ color }: { color: string }) {
  return (
    <span
      className="inline-block rounded-[18px] bg-white px-4 py-2 text-xl font-black"
      style={{ rotate: '-3deg', color, boxShadow: '0 5px 0 rgba(0,0,0,0.15)' }}
    >
      Population
    </span>
  )
}

function OfflineHome({ onPlay }: { onPlay: () => void }) {
  const [retry, setRetry] = useState<'idle' | 'checking' | 'failed'>('idle')

  async function tryAgain() {
    setRetry('checking')
    if (await siteReachable()) goOnline()
    else setRetry('failed')
  }

  return (
    <PopShell bg={POP.coral}>
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-5 pt-5">
        <header>
          <Tag color={POP.coral} />
        </header>

        <main className="flex flex-1 flex-col justify-center gap-4 py-10">
          <h1 className="text-[44px] font-black leading-[1.02] tracking-tight text-white">
            You&apos;re offline.
            <br />
            <span className="text-pop-ink">The world isn&apos;t.</span>
          </h1>
          <p className="max-w-[340px] text-lg font-bold leading-snug" style={{ color: POP.paper }}>
            Parties, the daily puzzle and your stats need the internet. A practice round works
            anywhere.
          </p>
        </main>

        <div className="flex flex-col gap-3 pb-6">
          <p role="status" className="min-h-[1.5em] text-center text-base font-black text-pop-ink">
            {retry === 'failed' ? "Still can't reach Population" : ''}
          </p>
          <PopButton variant="primary" size="lg" className="w-full" onClick={onPlay}>
            Play a practice round
          </PopButton>
          <PopButton
            variant="ghostLight"
            size="md"
            className="w-full"
            disabled={retry === 'checking'}
            onClick={() => void tryAgain()}
          >
            {retry === 'checking' ? 'Checking...' : 'Try again'}
          </PopButton>
          <p className="text-center text-sm font-bold" style={{ color: POP.paper }}>
            {DAILY_SIZE} questions. Practice rounds don&apos;t count toward stats or streaks.
          </p>
        </div>
      </div>
    </PopShell>
  )
}

function PracticeResult({
  total,
  max,
  onAgain,
  onHome,
}: {
  total: number
  max: number
  onAgain: () => void
  onHome: () => void
}) {
  return (
    <PopShell bg={POP.sunshine}>
      <header className="flex items-center justify-between px-5 pt-5">
        <Tag color={POP.sunshine} />
      </header>
      <main className="mx-auto flex w-full max-w-md flex-col items-center gap-6 px-5 pb-10 pt-10 text-center">
        <motion.h1
          initial={{ scale: 0, rotate: -6 }}
          animate={{ scale: 1, rotate: -2 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="pop-textshadow-sm text-5xl font-black text-pop-ink"
        >
          Round done!
        </motion.h1>

        <div className="w-full rounded-card bg-white p-7 shadow-pop-card">
          <div className="text-6xl font-black text-pop-ink">{total.toLocaleString()}</div>
          <div className="text-lg font-bold text-pop-ink/60">of {max.toLocaleString()} points</div>
        </div>

        <PopButton variant="primary" size="lg" className="w-full" onClick={onAgain}>
          Play another
        </PopButton>
        <PopButton variant="secondary" size="lg" className="w-full" onClick={onHome}>
          Back
        </PopButton>
        <p className="text-base font-bold text-pop-ink/60">
          Practice only, so nothing was saved. Back online, the daily puzzle and parties are waiting.
        </p>
      </main>
    </PopShell>
  )
}
