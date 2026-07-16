'use client'

import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowDownWideNarrow,
  CalendarDays,
  Flag,
  HelpCircle,
  MapPin,
  Smartphone,
  SlidersHorizontal,
  Target,
  Users,
  X,
} from 'lucide-react'

import { POP, POP_SPRING } from './pop/theme'

type Item = {
  icon: typeof Flag
  bg: string
  light: boolean
  title: string
  text: string
}

// bg colors chosen for contrast against a white card; `light` = needs white text.
const ANSWER_WAYS: Item[] = [
  {
    icon: Flag,
    bg: POP.coral,
    light: true,
    title: 'Flags, capitals & borders',
    text: 'Pick one of four options - or switch a category to typing for a proper test.',
  },
  {
    icon: SlidersHorizontal,
    bg: POP.cobalt,
    light: true,
    title: 'Estimates',
    text: 'Drag the slider to guess a number: population, land area, distance apart.',
  },
  {
    icon: MapPin,
    bg: POP.sunshine,
    light: false,
    title: 'Pin the map',
    text: 'Drop a pin. The closer you land the better - inside the country is full marks.',
  },
  {
    icon: ArrowDownWideNarrow,
    bg: POP.grape,
    light: true,
    title: 'Rank them',
    text: 'Drag places into order by population. Mostly right still earns partial credit.',
  },
]

const MODES: Item[] = [
  {
    icon: Users,
    bg: POP.coral,
    light: true,
    title: 'Party',
    text: 'Host a room, friends scan the QR or type the code. Live scoring, one-tap rematch.',
  },
  {
    icon: Smartphone,
    bg: POP.cobalt,
    light: true,
    title: 'By yourself',
    text: 'Play alone on one device. Try and get the highest score you can.',
  },
  {
    icon: CalendarDays,
    bg: POP.mint,
    light: true,
    title: 'Daily',
    text: 'One shared puzzle worldwide each day. Everybody gets the same questions.',
  },
]

function IconBadge({ item }: { item: Item }) {
  const Icon = item.icon
  return (
    <span
      className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl shadow-pop-sm"
      style={{ background: item.bg, color: item.light ? '#fff' : POP.ink }}
    >
      <Icon size={22} strokeWidth={2.5} />
    </span>
  )
}

function Card({ item, i }: { item: Item; i: number }) {
  return (
    <motion.div
      initial={{ scale: 0.94, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ ...POP_SPRING, delay: 0.04 * i }}
      className="flex items-start gap-4 rounded-3xl border-[3px] border-pop-ink/10 bg-white p-4 shadow-pop-sm"
    >
      <IconBadge item={item} />
      <div className="min-w-0">
        <h4 className="text-lg font-black leading-tight text-pop-ink">{item.title}</h4>
        <p className="mt-1 text-[15px] font-bold leading-snug text-pop-ink/65">{item.text}</p>
      </div>
    </motion.div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 text-2xl font-black text-pop-ink">{children}</h3>
}

/**
 * The shared "How to play" body. Rendered both on the standalone /how-to-play
 * page and inside <HowToPlayModal>. Layout is self-contained; the surrounding
 * shell (page header / modal card) supplies the background and padding.
 */
export function HowToPlayContent() {
  return (
    <div className="flex flex-col gap-8">
      {/* Goal */}
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={POP_SPRING}
        className="flex items-start gap-4 rounded-card border-4 border-white p-5"
        style={{ background: POP.mint }}
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/25 text-white">
          <Target size={26} strokeWidth={2.5} />
        </span>
        <div>
          <h3 className="text-2xl font-black text-white">Guess the world</h3>
          <p className="mt-1 text-[17px] font-bold leading-snug text-white/90">
            Every question is worth up to <span className="text-white">1,000 points</span>. The
            closer your guess, the more you score - and the highest total takes the crown 👑.
          </p>
        </div>
      </motion.div>

      {/* Question types */}
      <section>
        <SectionTitle>How you answer</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ANSWER_WAYS.map((item, i) => (
            <Card key={item.title} item={item} i={i} />
          ))}
        </div>
      </section>

      {/* Scoring */}
      <section>
        <SectionTitle>How scoring works</SectionTitle>
        <ul className="flex flex-col gap-2.5">
          {[
            'Closer guesses score higher - a bullseye is the full 1,000.',
            'On multiple-choice, answer fast for a speed bonus.',
            'No penalty for a wrong pick, so always take a swing.',
          ].map((line) => (
            <li key={line} className="flex items-start gap-3">
              <span
                className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: POP.coral }}
              />
              <span className="text-[16px] font-bold text-pop-ink/75">{line}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Ways to play */}
      <section>
        <SectionTitle>Ways to play</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {MODES.map((item, i) => (
            <Card key={item.title} item={item} i={i} />
          ))}
        </div>
      </section>
    </div>
  )
}

/**
 * Centered modal wrapper around <HowToPlayContent>. Driven by isOpen/onClose so
 * it can be opened independently from the setup and in-game screens. Sits at
 * z-50, above the host Dock (z-40). Backdrop-click and the ✕ both close it.
 */
export function HowToPlayModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(23,18,20,0.55)' }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="pop-scroll relative max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-[36px] bg-pop-paper p-6 md:p-8"
            style={{ boxShadow: '0 16px 0 rgba(0,0,0,0.2)' }}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-3xl font-black text-pop-ink md:text-4xl">How to play</h2>
              <button
                aria-label="Close"
                onClick={onClose}
                className="grid h-11 w-11 place-items-center rounded-full bg-pop-ink text-white shadow-pop-sm"
              >
                <X size={22} strokeWidth={3} />
              </button>
            </div>
            <HowToPlayContent />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Round "?" trigger for opening the how-to-play modal. `tone` matches it to the
 * screen: 'light' on dark backgrounds (in-game), 'dark' on light ones (setup).
 */
export function HowToPlayButton({
  onClick,
  tone = 'dark',
}: {
  onClick: () => void
  tone?: 'light' | 'dark'
}) {
  return (
    <motion.button
      aria-label="How to play"
      whileHover={{ rotate: 0, y: -2 }}
      whileTap={{ scale: 0.92 }}
      style={{ rotate: '2deg' }}
      onClick={onClick}
      className={
        tone === 'light'
          ? 'grid h-11 w-11 place-items-center rounded-full border-[3px] border-white text-white'
          : 'grid h-11 w-11 place-items-center rounded-full border-[3px] border-pop-ink text-pop-ink'
      }
    >
      <HelpCircle size={24} strokeWidth={2.5} />
    </motion.button>
  )
}
