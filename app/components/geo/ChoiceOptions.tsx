'use client'

import { motion } from 'motion/react'

import { POP } from '../pop/theme'

/**
 * 2×2 grid of answer buttons for a choice question. In reveal mode it colours
 * the correct option green and a wrong pick coral.
 */
export function ChoiceOptions({
  options,
  onSelect,
  selected,
  correct,
  disabled = false,
}: {
  options: string[]
  onSelect?: (option: string) => void
  selected?: string
  correct?: string // set in reveal mode
  disabled?: boolean
}) {
  return (
    <div className="grid w-full grid-cols-2 gap-2.5 sm:gap-3">
      {options.map((opt, i) => {
        const isSelected = selected === opt
        const isCorrect = correct != null && opt === correct
        const isWrongPick = correct != null && isSelected && opt !== correct

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
            key={opt}
            type="button"
            disabled={disabled || correct != null}
            whileHover={disabled || correct != null ? undefined : { y: -3, rotate: 0 }}
            whileTap={disabled || correct != null ? undefined : { y: 3 }}
            onClick={() => onSelect?.(opt)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, rotate: i % 2 === 0 ? -0.6 : 0.6 }}
            transition={{ delay: i * 0.04, type: 'spring', stiffness: 260, damping: 20 }}
            className="flex min-h-[64px] min-w-0 items-center justify-center text-balance break-words rounded-3xl border-4 border-pop-ink px-4 py-3 text-center text-base font-black leading-tight shadow-pop-btn sm:text-lg"
            style={{ background: bg, color }}
          >
            {opt}
          </motion.button>
        )
      })}
    </div>
  )
}
