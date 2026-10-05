'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowRight, Bird, Cat, CircleHelp, Flame, Rabbit, ScanLine, Trophy, UserRound } from 'lucide-react'

import stats from '../database/stats.json'
import { categories, MAX_SCORE } from '@/lib/utils'
import { DAILY_SIZE, dateKeyUTC } from '@/lib/daily'
import { scanQr } from '@/lib/native'
import { roomCodeFromScan } from '@/lib/roomCode'
import { useIsNativeApp } from '@/hooks/useNative'
import { PopShell } from '../components/pop/PopShell'
import { PopHeader, PopAuth } from '../components/pop/PopHeader'
import { POP, STICKER_FILLS } from '../components/pop/theme'

const DAILY_KEY = 'population-daily'
const DEAL = { type: 'spring' as const, stiffness: 220, damping: 22 }

type DailyState = { played: { total: number; buckets: string } | null; streak: number }

/** Today's daily from the device (written by DailyGame). Read after mount so hydration matches. */
function useDailyState(): DailyState | null {
  const [state, setState] = useState<DailyState | null>(null)
  useEffect(() => {
    let next: DailyState = { played: null, streak: 0 }
    try {
      const store = JSON.parse(localStorage.getItem(DAILY_KEY) || '{}')
      const today = dateKeyUTC(new Date())
      const yesterday = dateKeyUTC(new Date(Date.now() - 86_400_000))
      const alive = store.lastDate === today || store.lastDate === yesterday
      next = { played: store.plays?.[today] ?? null, streak: alive ? (store.streak ?? 0) : 0 }
    } catch {
      /* malformed storage reads as a fresh device */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe read of localStorage
    setState(next)
  }, [])
  return state
}

export function AppHome() {
  const reduce = useReducedMotion()
  const daily = useDailyState()
  const totalQuestions = (stats as Record<string, number>).total ?? 0

  // Tiles deal in like cards, once. Never hidden at rest: a stalled animation
  // still leaves them readable, and reduced motion skips it.
  const deal = (i: number, rotate: number) =>
    reduce
      ? { initial: false as const, style: { rotate } }
      : {
          initial: { y: 28, rotate: rotate * 3 },
          animate: { y: 0, rotate },
          transition: { ...DEAL, delay: 0.06 + i * 0.07 },
        }

  return (
    <PopShell bg={POP.coral} chips>
      <div className="flex min-h-full flex-col">
        <PopHeader logoTextColor={POP.coral} right={<PopAuth tone="light" />} />

        <main
          className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 md:max-w-lg"
          style={{ paddingBottom: 'calc(28px + env(safe-area-inset-bottom, 0px))' }}
        >
          {/* Fills the first screen; the tiles sit low, where a thumb lands. */}
          <section className="flex min-h-[calc(100svh-var(--safe-top)-env(safe-area-inset-bottom,0px)-124px)] flex-col justify-end gap-5 pb-2 pt-4">
            <div className="my-auto py-4 md:py-10">
              <h1
                className="pop-textshadow origin-left font-black leading-[0.86] tracking-[-0.035em] text-white"
                style={{ fontSize: 'clamp(64px, 21vw, 96px)', rotate: '-3deg' }}
              >
                Guess
                <br />
                the world.
              </h1>
              <p className="mt-5 max-w-[30ch] text-lg font-bold leading-snug text-pop-paper">
                Closest guess wins. Pick a way in.
              </p>
            </div>

            <motion.div {...deal(0, -1)}>
              <PartyTile />
            </motion.div>
            <motion.div {...deal(1, 1)}>
              <JoinTile />
            </motion.div>
            <motion.div {...deal(2, -0.5)}>
              <DailyTicket state={daily} />
            </motion.div>
          </section>

          <Formats totalQuestions={totalQuestions} />

          <nav aria-label="More" className="mt-10 grid grid-cols-3 gap-3">
            <MoreLink href="/highscores" label="Highscores" icon={<Trophy size={22} strokeWidth={2.5} />} />
            <MoreLink href="/how-to-play" label="How to play" icon={<CircleHelp size={22} strokeWidth={2.5} />} />
            <MoreLink href="/profile" label="Profile" icon={<UserRound size={22} strokeWidth={2.5} />} />
          </nav>

          <footer className="mt-12 flex flex-col items-center gap-3 text-center text-[15px] font-bold text-pop-paper/80">
            <div className="flex gap-5">
              <Link href="/about" className="py-1 hover:text-white">
                About
              </Link>
              <Link href="/privacy" className="py-1 hover:text-white">
                Privacy
              </Link>
              <Link href="/contact" className="py-1 hover:text-white">
                Contact
              </Link>
            </div>
            <a
              href="https://amaliesutviklingsfabrikk.no"
              target="_blank"
              rel="noopener noreferrer"
              className="font-extrabold text-white hover:underline"
            >
              Made by Amalies Utviklingsfabrikk
            </a>
          </footer>
        </main>
      </div>
    </PopShell>
  )
}

const TILE_PRESS = { whileTap: { y: 5, boxShadow: '0 3px 0 rgba(0,0,0,0.2)' } }

function PartyTile() {
  return (
    <motion.div {...TILE_PRESS} className="relative rounded-[28px] bg-white shadow-pop-card">
      <Players />
      <Link
        href="/new-game"
        className="flex items-center gap-4 rounded-[28px] p-5 pt-6 outline-none focus-visible:ring-4 focus-visible:ring-pop-ink"
      >
        <div className="min-w-0 flex-1">
          <div className="text-[32px] font-black leading-none tracking-[-0.02em] text-pop-coral">
            Start a party
          </div>
          <p className="mt-2 text-base font-bold leading-snug text-pop-ink/70">
            Host on this phone. Friends join with a code or a scan.
          </p>
        </div>
        <ArrowRight size={28} strokeWidth={3} className="shrink-0 self-end text-pop-coral" />
      </Link>
    </motion.div>
  )
}

// Three overlapping player stickers (fill + symbol, as in the lobby): the room you're about to fill.
const CAST = [Cat, Bird, Rabbit]

function Players() {
  return (
    <div className="pointer-events-none absolute -top-5 right-4 flex -space-x-3" aria-hidden>
      {CAST.map((Icon, i) => (
        <span
          key={i}
          className="flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-white text-pop-ink shadow-pop"
          style={{ background: STICKER_FILLS[i], rotate: `${(i - 1) * 8}deg`, zIndex: 3 - i }}
        >
          <Icon size={22} strokeWidth={2.5} />
        </span>
      ))}
    </div>
  )
}

function JoinTile() {
  const isNative = useIsNativeApp()
  const router = useRouter()
  const [notARoom, setNotARoom] = useState(false)

  async function scan() {
    setNotARoom(false)
    const text = await scanQr("Point the camera at the QR code on the host's screen")
    if (!text) return
    const slug = roomCodeFromScan(text)
    if (slug) router.push(`/join/${encodeURIComponent(slug)}`)
    else setNotARoom(true)
  }

  return (
    <div className="rounded-[28px] bg-pop-ink shadow-pop-card">
      <div className="flex items-stretch">
        <motion.div {...TILE_PRESS} className="min-w-0 flex-1 rounded-[28px]">
          <Link
            href="/join"
            className="flex h-full items-center gap-3 rounded-[28px] p-5 outline-none focus-visible:ring-4 focus-visible:ring-white"
          >
            <div className="min-w-0 flex-1">
              <div className="text-[28px] font-black leading-none tracking-[-0.02em] text-white">
                Join a game
              </div>
              <p className="mt-2 text-base font-bold leading-snug text-pop-paper/75">
                {isNative ? 'Type the code, or scan it.' : 'Type the code your host is showing.'}
              </p>
            </div>
            {!isNative && <ArrowRight size={28} strokeWidth={3} className="shrink-0 text-white" />}
          </Link>
        </motion.div>
        {isNative && (
          <motion.button
            type="button"
            onClick={scan}
            whileTap={{ scale: 0.94 }}
            className="m-3 flex w-[84px] shrink-0 flex-col items-center justify-center gap-1 rounded-[20px] bg-white text-pop-ink outline-none focus-visible:ring-4 focus-visible:ring-pop-sunshine"
          >
            <ScanLine size={30} strokeWidth={2.5} />
            <span className="text-sm font-black">Scan</span>
          </motion.button>
        )}
      </div>
      {notARoom && (
        <p role="alert" className="px-5 pb-4 text-[15px] font-bold text-pop-sunshine">
          That QR code isn&apos;t a Population room. Try typing the code instead.
        </p>
      )}
    </div>
  )
}

function DailyTicket({ state }: { state: DailyState | null }) {
  const played = state?.played ?? null
  const streak = state?.streak ?? 0
  const max = DAILY_SIZE * MAX_SCORE

  return (
    // The drop shadow sits on the wrapper so it follows the notches the mask cuts.
    <motion.div whileTap={{ y: 5 }} style={{ filter: 'drop-shadow(0 12px 0 rgba(0,0,0,0.15))' }}>
      <Link
        href="/daily"
        className="relative flex items-stretch rounded-[28px] outline-none focus-visible:ring-4 focus-visible:ring-pop-ink"
        style={{ background: POP.sunshine, ...TICKET_NOTCHES }}
      >
        <div className="min-w-0 flex-1 p-5 pr-4">
          <div className="text-[26px] font-black leading-none tracking-[-0.02em] text-pop-ink">
            Today&apos;s daily
          </div>
          {played ? (
            <>
              <p className="mt-2 text-base font-bold text-pop-ink/75">
                <span className="tabular-nums">{played.total.toLocaleString('en-US')}</span> / {max.toLocaleString('en-US')}.
                Back tomorrow for a new one.
              </p>
              <Buckets buckets={played.buckets} />
            </>
          ) : (
            <p className="mt-2 text-base font-bold leading-snug text-pop-ink/75">
              {DAILY_SIZE} questions, the same for everyone on Earth today.
            </p>
          )}
        </div>

        {/* Perforation: the ticket stub holds the streak or the call to play. */}
        <div className="relative flex w-[96px] shrink-0 flex-col items-center justify-center gap-1 border-l-[3px] border-dashed border-pop-ink/25 px-2 text-pop-ink">
          {streak > 0 ? (
            <>
              <Flame size={28} strokeWidth={2.5} className="text-pop-coral" />
              <span className="text-[26px] font-black leading-none tabular-nums">{streak}</span>
              <span className="text-xs font-black uppercase tracking-wide">day streak</span>
            </>
          ) : (
            <>
              <span className="text-xl font-black">{played ? 'See it' : 'Play'}</span>
              <ArrowRight size={26} strokeWidth={3} />
            </>
          )}
        </div>
      </Link>
    </motion.div>
  )
}

// Two notches punched out of the ticket where the perforation meets its edges.
const NOTCH = 'radial-gradient(circle 13px at calc(100% - 96px) {Y}, transparent 12px, #000 12.5px)'
const TICKET_NOTCHES = {
  WebkitMaskImage: `${NOTCH.replace('{Y}', '0')}, ${NOTCH.replace('{Y}', '100%')}`,
  WebkitMaskComposite: 'source-in',
  maskImage: `${NOTCH.replace('{Y}', '0')}, ${NOTCH.replace('{Y}', '100%')}`,
  maskComposite: 'intersect',
} as const

// The daily's result grid, drawn in the palette (the emoji string stays for share text).
const BUCKET_FILL: Record<string, string> = {
  '🟩': POP.mint,
  '🟨': '#FFFFFF',
  '🟧': POP.coral,
  '⬛': 'rgba(33,24,18,0.22)',
}
const BUCKET_WORD: Record<string, string> = { '🟩': 'great', '🟨': 'close', '🟧': 'far', '⬛': 'missed' }

function Buckets({ buckets }: { buckets: string }) {
  const cells = Array.from(buckets).filter((c) => c in BUCKET_FILL)
  const label = `Your answers: ${cells.map((c) => BUCKET_WORD[c]).join(', ')}`
  return (
    <div role="img" aria-label={label} className="mt-3 flex gap-1.5">
      {cells.map((c, i) => (
        <span key={i} className="h-4 w-4 rounded-[5px]" style={{ background: BUCKET_FILL[c] }} />
      ))}
    </div>
  )
}

// Each format drawn as a tiny piece of its own UI: breadth is the brand.
const FORMATS = [
  { name: 'Slide it', example: 'How many people live in Peru?', fill: POP.cobalt, art: <SliderArt /> },
  { name: 'Pick one', example: 'Which flag is Chile?', fill: POP.grape, art: <ChoiceArt /> },
  { name: 'Pin it', example: 'Drop a pin on Ulaanbaatar.', fill: POP.mint, art: <MapArt /> },
  { name: 'Rank them', example: 'Sort four countries by population.', fill: POP.bubblegum, art: <RankArt /> },
]

function Formats({ totalQuestions }: { totalQuestions: number }) {
  return (
    <section aria-labelledby="formats" className="mt-10">
      <h2 id="formats" className="text-[28px] font-black leading-tight tracking-[-0.02em] text-white">
        One game, many ways to guess
      </h2>
      <p className="mt-1 text-base font-bold text-pop-paper/85">
        <span className="tabular-nums">{totalQuestions.toLocaleString('en-US')}</span> questions across{' '}
        {categories.length} categories. The closer you get, the more you score.
      </p>
      <ul className="-mx-5 mt-5 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-4 pt-1 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0">
        {FORMATS.map((f, i) => (
          <li
            key={f.name}
            className="w-[70%] shrink-0 snap-start rounded-[24px] bg-white p-4 shadow-pop md:w-auto"
            style={{ rotate: `${i % 2 === 0 ? -1 : 1}deg` }}
          >
            <div className="flex h-[84px] items-center justify-center rounded-[16px]" style={{ background: f.fill }}>
              {f.art}
            </div>
            <div className="mt-3 text-xl font-black text-pop-ink">{f.name}</div>
            <p className="mt-0.5 text-[15px] font-bold leading-snug text-pop-ink/65">{f.example}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

function SliderArt() {
  return (
    <div className="relative h-3 w-[70%] rounded-full bg-white/35" aria-hidden>
      <div className="absolute inset-y-0 left-0 w-[62%] rounded-full bg-white" />
      <div className="absolute left-[62%] top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-pop-sunshine" />
    </div>
  )
}

function ChoiceArt() {
  return (
    <div className="grid grid-cols-2 gap-1.5" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={`h-5 w-14 rounded-full ${i === 1 ? 'bg-pop-sunshine' : 'bg-white/80'}`}
        />
      ))}
    </div>
  )
}

function MapArt() {
  return (
    <svg width="120" height="64" viewBox="0 0 120 64" aria-hidden>
      {Array.from({ length: 6 * 12 }, (_, k) => {
        const x = (k % 12) * 10 + 5
        const y = Math.floor(k / 12) * 10 + 7
        return <circle key={k} cx={x} cy={y} r="1.8" fill="white" opacity="0.45" />
      })}
      <path
        d="M78 8c-7 0-12 5.2-12 11.6C66 28 78 40 78 40s12-12 12-20.4C90 13.2 85 8 78 8Z"
        fill={POP.sunshine}
        stroke="white"
        strokeWidth="3"
      />
      <circle cx="78" cy="19.5" r="4" fill="white" />
    </svg>
  )
}

function RankArt() {
  return (
    <div className="flex w-[60%] flex-col gap-1.5" aria-hidden>
      {[100, 76, 52, 30].map((w, i) => (
        <span key={w} className={`h-2.5 rounded-full ${i === 0 ? 'bg-pop-sunshine' : 'bg-white/85'}`} style={{ width: `${w}%` }} />
      ))}
    </div>
  )
}

function MoreLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1.5 rounded-[20px] border-[3px] border-white/80 px-2 py-3 text-center text-[15px] font-black text-white outline-none transition-colors hover:bg-white/10 focus-visible:ring-4 focus-visible:ring-white"
    >
      {icon}
      {label}
    </Link>
  )
}
