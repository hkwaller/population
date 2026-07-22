'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Timer } from 'lucide-react'

import type { BuildUpQuestion } from '@/app/types'
import { COUNTRIES } from '@/lib/geo/countries'
import { PopButton } from '../pop/PopButton'

/** A fresh clue drips in on this cadence; more clues showing = fewer points. */
const REVEAL_INTERVAL_MS = 5000
const REVEAL_INTERVAL_S = REVEAL_INTERVAL_MS / 1000

const COUNTRY_NAMES = Array.from(new Set(COUNTRIES.map((c) => c.name))).sort((a, b) =>
  a.localeCompare(b),
)

function norm(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

const MAX_SUGGESTIONS = 6

/**
 * Build-up ("Name It"): clues drip in automatically every REVEAL_INTERVAL_MS, and
 * a country typeahead commits the guess. Score decays with how many clues were
 * showing at lock-in, so guessing early (before the next clue lands) is worth more.
 * Lives in the scroll flow with its own Lock bar.
 */
export function BuildUp({
  question,
  onAnswer,
  disabled = false,
}: {
  question: BuildUpQuestion
  onAnswer: (value: string, elapsedMs: number, extra?: { cluesUsed?: number }) => void
  disabled?: boolean
}) {
  const [revealed, setRevealed] = useState(1) // first clue is free
  const [secsLeft, setSecsLeft] = useState(REVEAL_INTERVAL_S)
  const [text, setText] = useState('')
  const [active, setActive] = useState(0)
  const [focused, setFocused] = useState(false)

  const total = question.clues.length
  const allRevealed = revealed >= total

  // Drip the next clue in on a timer (paused once all are shown or locked). The
  // effect re-runs each time `revealed` changes, restarting the countdown. All
  // state updates happen inside the async timer callbacks (never synchronously in
  // the effect body) so we don't trigger cascading renders.
  useEffect(() => {
    if (disabled || revealed >= total) return
    const tick = setInterval(() => setSecsLeft((s) => (s > 1 ? s - 1 : s)), 1000)
    const reveal = setTimeout(() => {
      setRevealed((r) => Math.min(total, r + 1))
      setSecsLeft(REVEAL_INTERVAL_S) // reset the countdown for the next clue
    }, REVEAL_INTERVAL_MS)
    return () => {
      clearInterval(tick)
      clearTimeout(reveal)
    }
  }, [revealed, disabled, total])

  const suggestions = useMemo(() => {
    const n = norm(text)
    if (!n) return []
    const starts: string[] = []
    const contains: string[] = []
    for (const item of COUNTRY_NAMES) {
      const ni = norm(item)
      if (ni === n) continue
      if (ni.startsWith(n)) starts.push(item)
      else if (ni.includes(n)) contains.push(item)
      if (starts.length >= MAX_SUGGESTIONS) break
    }
    return [...starts, ...contains].slice(0, MAX_SUGGESTIONS)
  }, [text])

  const showList = focused && suggestions.length > 0

  const commit = (raw: string) => {
    if (disabled) return
    const value = raw.trim()
    if (!value) return
    const canonical = COUNTRY_NAMES.find((item) => norm(item) === norm(value)) ?? value
    // Build-up isn't timed (score comes from cluesUsed), so elapsedMs is 0.
    onAnswer(canonical, 0, { cluesUsed: revealed })
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showList && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault()
      setActive((i) => {
        const next = e.key === 'ArrowDown' ? i + 1 : i - 1
        return (next + suggestions.length) % suggestions.length
      })
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      commit(showList ? suggestions[active] : text)
    }
  }

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Clues */}
      <div className="flex flex-col gap-2">
        {question.clues.slice(0, revealed).map((clue, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border-4 border-pop-ink bg-white px-5 py-3 text-left text-lg font-black text-pop-ink"
          >
            <span className="mr-2 text-pop-ink/40">{i + 1}.</span>
            {clue}
          </motion.div>
        ))}
      </div>

      {!allRevealed && !disabled && (
        <div className="mx-auto flex items-center gap-2 rounded-pill border-2 border-pop-ink bg-pop-sunshine px-4 py-2 text-sm font-black text-pop-ink">
          <Timer size={16} strokeWidth={3} />
          Next clue in {secsLeft}s — guess now for more points!
        </div>
      )}

      {/* Typeahead */}
      <div className="relative">
        <AnimatePresence>
          {showList && (
            <motion.ul
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.12 }}
              className="absolute bottom-full left-0 right-0 z-10 mb-2 overflow-hidden rounded-[20px] border-4 border-pop-ink bg-white shadow-pop-card"
            >
              {suggestions.map((s, i) => (
                <li key={s}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      commit(s)
                    }}
                    onMouseEnter={() => setActive(i)}
                    className={`block w-full px-5 py-3 text-left text-lg font-black text-pop-ink ${
                      i === active ? 'bg-pop-sunshine' : 'bg-white'
                    }`}
                  >
                    {s}
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>

        <input
          value={text}
          disabled={disabled}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="words"
          spellCheck={false}
          placeholder="Which country?"
          onChange={(e) => {
            setText(e.target.value)
            setActive(0)
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={onKeyDown}
          className="w-full rounded-pill border-4 border-pop-ink bg-white px-6 py-4 text-xl font-black text-pop-ink outline-none placeholder:text-[rgba(23,18,20,0.35)] focus:ring-4 focus:ring-pop-ink disabled:opacity-60"
        />
      </div>

      <PopButton
        variant="primary"
        size="lg"
        rotate={-1}
        className="w-full"
        disabled={disabled || !text.trim()}
        onClick={() => commit(text)}
      >
        Lock it in
      </PopButton>
    </div>
  )
}
