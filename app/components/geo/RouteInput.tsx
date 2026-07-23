'use client'

import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

import type { RouteAnswer, RouteQuestion } from '@/app/types'
import { COUNTRIES, byCca3 } from '@/lib/geo/countries'
import { areAdjacent } from '@/lib/geo/adjacency'
import { PopButton } from '../pop/PopButton'
import { RouteMap } from './RouteMap'
import { RoutePathFlags, RouteWrongFlags } from './RouteFlags'

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
const name = (cca3: string) => byCca3.get(cca3)?.name ?? cca3

/**
 * Border Hopper input: walk from a fixed start to a fixed end one land border at a
 * time. You add the next country by name; if it genuinely borders your current
 * location it joins the path, otherwise it's an impossible hop - rejected (you stay
 * put), logged under the path, and it docks points. Reaching the destination
 * completes the route. Lives in the scroll flow.
 */
export function RouteInput({
  question,
  onAnswer,
  disabled = false,
}: {
  question: RouteQuestion
  onAnswer: (value: RouteAnswer, elapsedMs: number) => void
  disabled?: boolean
}) {
  const [path, setPath] = useState<string[]>([question.from])
  const [wrong, setWrong] = useState<string[]>([])
  const [text, setText] = useState('')
  const [active, setActive] = useState(0)
  const [focused, setFocused] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const current = path[path.length - 1]
  const reached = current === question.to
  const locked = disabled || reached

  const suggestions = useMemo(() => {
    const n = norm(text)
    if (!n) return []
    const starts: typeof NAMED = []
    const contains: typeof NAMED = []
    const used = new Set(path) // can't revisit a country already on the path
    for (const item of NAMED) {
      if (used.has(item.cca3)) continue
      const ni = norm(item.name)
      if (ni.startsWith(n)) starts.push(item)
      else if (ni.includes(n)) contains.push(item)
      if (starts.length >= MAX_SUGGESTIONS) break
    }
    return [...starts, ...contains].slice(0, MAX_SUGGESTIONS)
  }, [text, path])

  const showList = focused && suggestions.length > 0

  const flash = (msg: string) => {
    setNote(msg)
    if (noteTimer.current) clearTimeout(noteTimer.current)
    noteTimer.current = setTimeout(() => setNote(null), 2600)
  }

  const add = (cca3: string) => {
    if (locked) return
    setText('')
    setActive(0)
    if (path.includes(cca3)) return // already on the path - ignore
    if (!areAdjacent(current, cca3)) {
      // Impossible hop from here: reject the move, log it, dock points.
      setWrong((w) => [...w, cca3])
      flash(`${name(cca3)} doesn't border ${name(current)} — −100`)
      return
    }
    setNote(null)
    // Valid hop. If it lands on the destination - or on one of the destination's
    // neighbours - the journey is complete, so snap the destination on: you never
    // have to type the finish line yourself.
    if (cca3 === question.to || areAdjacent(cca3, question.to)) {
      setPath((p) => (cca3 === question.to ? [...p, cca3] : [...p, cca3, question.to]))
    } else {
      setPath((p) => [...p, cca3])
    }
  }

  const undo = () => {
    if (locked) return
    setPath((p) => (p.length > 1 ? p.slice(0, -1) : p))
  }

  const commit = () => {
    if (disabled) return
    // Route isn't timed (score comes from completeness + wrong hops), so elapsedMs is 0.
    onAnswer({ path, wrong }, 0)
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
        Shortest {question.optimalSteps} hops · you {path.length - 1}
        {wrong.length > 0 && <span className="text-pop-coral"> · {wrong.length} wrong</span>}
      </p>

      <RouteMap from={question.from} to={question.to} chain={path} bounded={false} />

      {/* The path you've walked, as flags: type a country, then see (or learn) its
          flag. Start/destination are fixed; the last hop can be undone. */}
      <div className="flex flex-col gap-3 rounded-3xl border-4 border-pop-ink bg-white px-4 py-4">
        <RoutePathFlags path={path} to={question.to} onUndo={locked ? undefined : undo} />
        <RouteWrongFlags wrong={wrong} />
      </div>

      {reached && (
        <p className="text-center text-base font-black text-pop-mint">
          Connected! Lock it in.
        </p>
      )}

      {/* Typeahead to attempt the next hop */}
      {!reached && (
        <div className="relative mt-1">
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
            disabled={locked}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="words"
            spellCheck={false}
            placeholder={`Which country borders ${name(current)}?`}
            onChange={(e) => {
              setText(e.target.value)
              setActive(0)
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={onKeyDown}
            className="w-full rounded-pill border-4 border-pop-ink bg-white px-6 py-4 text-lg font-black text-pop-ink outline-none placeholder:text-[rgba(23,18,20,0.35)] focus:ring-4 focus:ring-pop-ink disabled:opacity-60"
          />
          <AnimatePresence>
            {note && (
              <motion.p
                key={note}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-2 text-center text-sm font-black text-pop-coral"
              >
                {note}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}

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
