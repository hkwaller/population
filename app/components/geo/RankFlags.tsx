'use client'

import { byName } from '@/lib/geo/countries'
import { POP } from '../pop/theme'

/** A country flag by name (falls back to a labelled chip when we can't resolve it). */
export function CountryFlag({
  label,
  size = 44,
  borderColor,
  title,
}: {
  label: string
  size?: number
  /** Overrides the default ink border — used to mark a guess right/wrong. */
  borderColor?: string
  title?: string
}) {
  const cca2 = byName.get(label)?.cca2
  const border = borderColor ?? POP.ink
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
 * A player's rank guess as flags only — each flag bordered green (right slot) or
 * red (wrong slot) against the correct order. Easier to scan than reading names.
 */
export function RankGuessFlags({ guess, answer }: { guess: string[]; answer: string[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {guess.map((label, i) => {
        const correct = answer[i] === label
        return (
          <CountryFlag
            key={`${label}-${i}`}
            label={label}
            size={30}
            borderColor={correct ? POP.mint : POP.coral}
            title={`${i + 1}. ${label} — ${correct ? 'correct' : 'wrong'}`}
          />
        )
      })}
    </div>
  )
}
