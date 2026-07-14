'use client'

import { Fragment } from 'react'
import { ChevronRight } from 'lucide-react'

import type { RankQuestion } from '@/app/types'
import { formatCompactNumber } from '@/lib/utils'
import { POP } from '../pop/theme'
import { CountryFlag, RankGuessFlags } from './RankFlags'

/**
 * Reveal for a rank question: the correct order shown left-to-right as flag +
 * name chips, separated by a chevron (most populous first). When a `guess` is
 * given (solo/daily), the player's order is shown below as flags bordered
 * green/red per slot.
 */
export function RankReveal({ question, guess }: { question: RankQuestion; guess?: string[] }) {
  const valueOf = new Map(question.items.map((i) => [i.label, i.value]))
  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-3">
        {question.answer.map((label, i) => (
          <Fragment key={label}>
            {i > 0 && (
              <ChevronRight size={22} className="flex-none" color={POP.ink} strokeWidth={3} />
            )}
            <div className="flex flex-col items-center gap-1.5">
              <CountryFlag label={label} size={52} />
              <span className="max-w-[92px] text-center text-sm font-black leading-tight text-pop-ink">
                {label}
              </span>
              <span className="text-xs font-bold text-pop-ink/45">
                {formatCompactNumber(valueOf.get(label) ?? 0)}
              </span>
            </div>
          </Fragment>
        ))}
      </div>
      {guess && (
        <div className="flex w-full flex-col items-center gap-2 border-t-2 border-pop-ink/10 pt-4">
          <span className="text-xs font-black uppercase tracking-wide text-pop-ink/45">
            Your order
          </span>
          <RankGuessFlags guess={guess} answer={question.answer} />
        </div>
      )}
    </div>
  )
}
