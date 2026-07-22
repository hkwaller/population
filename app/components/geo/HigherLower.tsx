'use client'

import { motion } from 'motion/react'

import type { HigherLowerQuestion } from '@/app/types'
import { POP } from '../pop/theme'

type Side = 'left' | 'right'

/**
 * Two tap targets for a higher-lower question ("which has more X?"). In reveal
 * mode it shows both values and colours the higher side mint, a wrong pick coral.
 */
export function HigherLower({
  question,
  onSelect,
  selected,
  reveal = false,
  disabled = false,
}: {
  question: HigherLowerQuestion
  onSelect?: (side: Side) => void
  selected?: Side
  reveal?: boolean
  disabled?: boolean
}) {
  const sides: Side[] = ['left', 'right']
  const locked = disabled || reveal

  return (
    <div className="grid w-full grid-cols-2 gap-2.5 sm:gap-3">
      {sides.map((side, i) => {
        const data = question[side]
        const isSelected = selected === side
        const isCorrect = reveal && question.answer === side
        const isWrongPick = reveal && isSelected && question.answer !== side

        let bg: string = '#fff'
        let color: string = POP.ink
        if (isCorrect) {
          bg = POP.mint
        } else if (isWrongPick) {
          bg = POP.coral
          color = '#fff'
        } else if (isSelected) {
          bg = POP.sunshine
        }

        return (
          <motion.button
            key={side}
            type="button"
            disabled={locked}
            whileHover={locked ? undefined : { y: -3 }}
            whileTap={locked ? undefined : { y: 3 }}
            onClick={() => onSelect?.(side)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, rotate: i % 2 === 0 ? -0.6 : 0.6 }}
            transition={{ delay: i * 0.04, type: 'spring', stiffness: 260, damping: 20 }}
            className="flex min-h-[96px] min-w-0 flex-col items-center justify-center gap-1 text-balance break-words rounded-3xl border-4 border-pop-ink px-4 py-4 text-center font-black leading-tight shadow-pop-btn"
            style={{ background: bg, color }}
          >
            {data.code ? <span className="text-3xl leading-none">{data.code}</span> : null}
            <span className="text-lg sm:text-xl">{data.label}</span>
            {reveal ? (
              <span className="text-sm font-bold opacity-70">
                {data.value.toLocaleString()}
              </span>
            ) : null}
          </motion.button>
        )
      })}
    </div>
  )
}
