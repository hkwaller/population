'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

import type { RouteQuestion } from '@/app/types'
import { COUNTRIES } from '@/lib/geo/countries'
import { PopButton } from '../pop/PopButton'
import { RouteMap } from './RouteMap'
import { RouteChainFlags } from './RouteFlags'

const NAMED = COUNTRIES.map((c) => ({ name: c.name, cca3: c.cca3 })).sort((a, b) =>
  a.name.localeCompare(b.name),
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
 * Border Hopper input: build an ordered chain of bordering countries from a fixed
 * start to a fixed end. The player adds intermediate countries via typeahead (any
 * country - adjacency is validated at scoring). Lives in the scroll flow.
 */
export function RouteInput({
  question,
  onAnswer,
  disabled = false,
}: {
  question: RouteQuestion
  onAnswer: (value: string[], elapsedMs: number) => void
  disabled?: boolean
}) {
  const [middle, setMiddle] = useState<string[]>([]) // cca3 of intermediate hops
  const [text, setText] = useState('')
  const [active, setActive] = useState(0)
  const [focused, setFocused] = useState(false)

  const chain = useMemo(
    () => [question.from, ...middle, question.to],
    [question.from, question.to, middle],
  )
  const hops = chain.length - 1

  const suggestions = useMemo(() => {
    const n = norm(text)
    if (!n) return []
    const starts: typeof NAMED = []
    const contains: typeof NAMED = []
    const used = new Set(chain)
    for (const item of NAMED) {
      if (used.has(item.cca3)) continue
      const ni = norm(item.name)
      if (ni.startsWith(n)) starts.push(item)
      else if (ni.includes(n)) contains.push(item)
      if (starts.length >= MAX_SUGGESTIONS) break
    }
    return [...starts, ...contains].slice(0, MAX_SUGGESTIONS)
  }, [text, chain])

  const showList = focused && suggestions.length > 0

  const add = (cca3: string) => {
    if (disabled) return
    setMiddle((m) => [...m, cca3])
    setText('')
    setActive(0)
  }

  const removeAt = (i: number) => {
    if (disabled) return
    setMiddle((m) => m.filter((_, idx) => idx !== i))
  }

  const commit = () => {
    if (disabled) return
    // Route isn't timed (score comes from path validity/optimality), so elapsedMs is 0.
    onAnswer(chain, 0)
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
    if (e.key === 'Enter' && showList) {
      e.preventDefault()
      add(suggestions[active].cca3)
    }
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <p className="text-center text-sm font-black uppercase tracking-wide text-pop-ink/50">
        Aim for {question.optimalSteps} hops · max {question.maxSteps} · you: {hops}
      </p>

      <RouteMap from={question.from} to={question.to} chain={chain} />

      {/* The proposed trip as a horizontal row of flags: enter a country by name,
          then see (or learn) its flag. Start/end are fixed; hops are removable. */}
      <div className="rounded-3xl border-4 border-pop-ink bg-white px-4 py-4">
        <RouteChainFlags
          chain={chain}
          from={question.from}
          to={question.to}
          onRemove={disabled ? undefined : removeAt}
        />
      </div>

      {/* Typeahead to add a hop */}
      <div className="relative mt-2">
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
                <li key={s.cca3}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      add(s.cca3)
                    }}
                    onMouseEnter={() => setActive(i)}
                    className={`block w-full px-5 py-3 text-left text-lg font-black text-pop-ink ${
                      i === active ? 'bg-pop-sunshine' : 'bg-white'
                    }`}
                  >
                    {s.name}
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
          placeholder="Add a country to hop through…"
          onChange={(e) => {
            setText(e.target.value)
            setActive(0)
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={onKeyDown}
          className="w-full rounded-pill border-4 border-pop-ink bg-white px-6 py-4 text-lg font-black text-pop-ink outline-none placeholder:text-[rgba(23,18,20,0.35)] focus:ring-4 focus:ring-pop-ink disabled:opacity-60"
        />
      </div>

      <PopButton
        variant="primary"
        size="lg"
        rotate={-1}
        className="w-full"
        disabled={disabled}
        onClick={commit}
      >
        Lock in route
      </PopButton>
    </div>
  )
}
