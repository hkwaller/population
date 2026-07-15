'use client'

import { Fragment } from 'react'
import { Check, ChevronRight, X } from 'lucide-react'

import { byName } from '@/lib/geo/countries'
import { POP } from '../pop/theme'

/** A country flag by name (falls back to a labelled chip when we can't resolve it). */
export function CountryFlag({
  label,
  size = 44,
  title,
}: {
  label: string
  size?: number
  title?: string
}) {
  const cca2 = byName.get(label)?.cca2
  const border = POP.ink
  const common = {
    width: size,
    height: Math.round(size * 0.68),
    title: title ?? label,
  }
  if (!cca2) {
    return (
      <span
        className="flex items-center justify-center rounded-md px-2 text-[11px] font-black text-pop-ink"
        style={{ ...common, border: `3px solid ${border}` }}
      >
        {label.slice(0, 3).toUpperCase()}
      </span>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/flags/${cca2.toLowerCase()}.svg`}
      alt={label}
      className="rounded-md object-cover"
      style={{ ...common, border: `3px solid ${border}`, boxSizing: 'border-box' }}
    />
  )
}

/**
 * The correct rank order as a compact flag row, separated by chevrons. Used where
 * space is tight (e.g. the end-page recap) - flags + names, no population values.
 */
export function RankAnswerFlags({ answer, size = 34 }: { answer: string[]; size?: number }) {
  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
      {answer.map((label, i) => (
        <Fragment key={label}>
          {i > 0 && (
            <ChevronRight size={16} className="flex-none" color={POP.ink} strokeWidth={3} />
          )}
          <div className="flex flex-col items-center gap-1">
            <CountryFlag label={label} size={size} />
            <span className="max-w-[72px] text-center text-[11px] font-black leading-tight text-pop-ink">
              {label}
            </span>
          </div>
        </Fragment>
      ))}
    </div>
  )
}

/**
 * A player's rank guess as flags only. Each flag carries a small badge - a green
 * check (right slot) or red cross (wrong slot) - in the corner. A badge reads more
 * clearly than a coloured border, since the flags themselves are full of red/green.
 */
export function RankGuessFlags({ guess, answer }: { guess: string[]; answer: string[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {guess.map((label, i) => {
        const correct = answer[i] === label
        return (
          <div key={`${label}-${i}`} className="relative flex-none leading-none">
            <CountryFlag label={label} size={30} title={`${i + 1}. ${label}`} />
            <span
              className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white"
              style={{ background: correct ? POP.mint : POP.coral }}
              title={correct ? 'correct' : 'wrong'}
            >
              {correct ? (
                <Check size={9} strokeWidth={4} color="#fff" />
              ) : (
                <X size={9} strokeWidth={4} color="#fff" />
              )}
            </span>
          </div>
        )
      })}
    </div>
  )
}
