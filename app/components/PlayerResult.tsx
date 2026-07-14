'use client'

import { createElement } from 'react'
import { icons } from 'lucide-react'
import { motion } from 'motion/react'
import CountUp from 'react-countup'

import { AnswerValue, TPlayer } from '../types'
import { formatAnswerValue, MAX_SCORE } from '@/lib/utils'
import { POP, stickerFill } from './pop/theme'

export const PlayerResult = ({
  player,
  answer,
  score,
  index,
  isClosest = false,
  isWinner = false,
}: {
  player: TPlayer
  index: number
  answer?: AnswerValue
  score: number
  isClosest?: boolean
  isWinner?: boolean
}) => {
  const Icon = icons[player.icon as keyof typeof icons]
  const bullseye = score >= MAX_SCORE
  const pointsBg = isWinner || isClosest ? POP.coral : POP.ink

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, rotate: index % 2 === 0 ? 2 : -2 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 + index * 0.06 }}
      className="relative flex w-[210px] max-w-full flex-col items-center gap-2 rounded-[28px] bg-white p-4 shadow-pop"
    >
      {isClosest && (
        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-pill px-3 py-1 text-xs font-black text-white"
          style={{ background: POP.coral, rotate: '-4deg' }}
        >
          CLOSEST!
        </span>
      )}
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-pop-ink"
        style={{ background: stickerFill(player.color) }}
      >
        {Icon && createElement(Icon, { size: 26, className: 'text-pop-ink' })}
      </div>
      <span className="text-[22px] font-black text-pop-ink">{player.name}</span>
      {answer !== undefined && (
        <span className="text-[17px] font-bold text-pop-ink/60">
          guessed {formatAnswerValue(answer)}
        </span>
      )}
      <span
        className="rounded-pill px-4 py-1.5 text-lg font-black text-white"
        style={{ background: pointsBg }}
      >
        {bullseye ? '🎯 ' : '+'}
        <CountUp end={score} duration={0.6} separator="" preserveValue />
      </span>
    </motion.div>
  )
}
