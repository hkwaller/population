'use client'

import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

import type { ChoiceQuestion } from '@/app/types'
import { COUNTRIES } from '@/lib/geo/countries'
import { PopButton } from '../pop/PopButton'

/** Canonical answer pools, built once. Answers to capital questions always come
 *  straight from countries.json, so an exact (case-insensitive) match here maps
 *  cleanly back to the string `scoreChoice` expects. */
const CAPITALS = uniqSorted(COUNTRIES.map((c) => c.capital).filter(Boolean) as string[])
const COUNTRY_NAMES = uniqSorted(COUNTRIES.map((c) => c.name))
const COMBINED = uniqSorted([...CAPITALS, ...COUNTRY_NAMES])

function uniqSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))
}

function norm(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * Pick the right suggestion pool from the question wording. The generator emits
 * two shapes for the `capitals` category - "What is the capital of X?" (answer =
 * a capital) and "Which country's capital is Y?" (answer = a country). Fall back
 * to the combined list for anything phrased differently.
 */
function poolFor(question: string): string[] {
  const q = question.toLowerCase()
  if (/capital of/.test(q)) return CAPITALS
  if (/country'?s capital|which country/.test(q)) return COUNTRY_NAMES
  return COMBINED
}

const MAX_SUGGESTIONS = 6

/**
 * Autocomplete text input for capital-category questions, used when the host
 * enables "type capital answers". Filters a canonical list of capitals/countries
 * and submits the canonical spelling so scoring matches exactly.
 */
export function CapitalInput({
  question,
  onAnswer,
  disabled = false,
}: {
  question: ChoiceQuestion
  onAnswer: (value: string) => void
  disabled?: boolean
}) {
  const [text, setText] = useState('')
  const [active, setActive] = useState(0)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const pool = useMemo(() => poolFor(question.question), [question.question])

  const suggestions = useMemo(() => {
    const n = norm(text)
    if (!n) return []
    const starts: string[] = []
    const contains: string[] = []
    for (const item of pool) {
      const ni = norm(item)
      if (ni === n) continue // exact match needs no hint
      if (ni.startsWith(n)) starts.push(item)
      else if (ni.includes(n)) contains.push(item)
      if (starts.length >= MAX_SUGGESTIONS) break
    }
    return [...starts, ...contains].slice(0, MAX_SUGGESTIONS)
  }, [text, pool])

  const showList = focused && suggestions.length > 0

  const commit = (raw: string) => {
    if (disabled) return
    const value = raw.trim()
    if (!value) return
    // Resolve to the canonical spelling so an exact string match scores correctly.
    const canonical = pool.find((item) => norm(item) === norm(value)) ?? value
    onAnswer(canonical)
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
    <div className="flex flex-col gap-3">
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
                    // onMouseDown fires before the input blur, so the pick isn't lost.
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
          ref={inputRef}
          value={text}
          disabled={disabled}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="words"
          spellCheck={false}
          placeholder="Type your answer…"
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
