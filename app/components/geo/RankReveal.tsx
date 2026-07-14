'use client'

import { Check, X } from 'lucide-react'

import type { RankQuestion } from '@/app/types'
import { formatCompactNumber } from '@/lib/utils'
import { POP } from '../pop/theme'

/**
 * Reveal for a rank question: shows the correct order (with values) and, when a
 * guess is given, marks each position right/wrong against it.
 */
export function RankReveal({
  question,
  guess,
}: {
  question: RankQuestion
  guess?: string[]
}) {
  const valueOf = new Map(question.items.map((i) => [i.label, i.value]))
  return (
    <div className="flex w-full flex-col gap-2">
      {question.answer.map((label, i) => {
        const correctHere = guess ? guess[i] === label : undefined
        return (
          <div
            key={label}
            className="flex items-center gap-3 rounded-pill border-2 border-pop-ink/15 bg-white px-4 py-2.5"
          >
            <span
              className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-sm font-black text-white"
              style={{ background: POP.ink }}
            >
              {i + 1}
            </span>
            <span className="text-base font-black text-pop-ink">{label}</span>
            <span className="ml-auto text-sm font-bold text-pop-ink/50">
              {formatCompactNumber(valueOf.get(label) ?? 0)}
            </span>
            {correctHere === true && <Check size={18} className="flex-none" color={POP.ink} />}
            {correctHere === false && <X size={18} className="flex-none" color={POP.coral} />}
          </div>
        )
      })}
    </div>
  )
}
