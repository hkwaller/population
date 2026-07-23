'use client'

import { createElement } from 'react'
import { icons } from 'lucide-react'
import { motion } from 'motion/react'
import CountUp from 'react-countup'

import { AnswerValue, LatLng, TPlayer, TQuestion } from '../types'
import { formatAnswerValue, haversineKm, MAX_SCORE } from '@/lib/utils'
import { POP, stickerFill } from './pop/theme'
import { RankGuessFlags } from './geo/RankFlags'
import { RouteGuessFlags } from './geo/RouteFlags'

export const PlayerResult = ({
  player,
  answer,
  score,
  index,
  question,
  isClosest = false,
  isWinner = false,
}: {
  player: TPlayer
  index: number
  answer?: AnswerValue
  score: number
  question?: TQuestion
  isClosest?: boolean
  isWinner?: boolean
}) => {
  const Icon = icons[player.icon as keyof typeof icons]
  const bullseye = score >= MAX_SCORE

  // Exact-answer rounds (choice / higher-lower / odd-one-out) are simply right or
  // wrong - there's no "closest".
  const isExact =
    question?.type === 'choice' ||
    question?.type === 'higher-lower' ||
    question?.type === 'odd-one-out'
  const isCorrect = isExact && score > 0
  // Estimation rounds (slider/map/rank) can still be nailed exactly - a full score
  // means "perfect", not merely "closest".
  const isPerfect = !isExact && bullseye

  // Pill: "CORRECT!" nailed an exact round, "PERFECT!" nailed an estimation round,
  // "CLOSEST!" only for the top proximity guess that wasn't perfect.
  const positive = isCorrect || isPerfect
  const pill = positive
    ? isExact
      ? 'CORRECT!'
      : 'PERFECT!'
    : // "CLOSEST!" only makes sense for a guess that actually scored - a 0 (e.g. a
      // route that never connected) isn't "close" to anything.
      !isExact && isClosest && score > 0
      ? 'CLOSEST!'
      : null
  const pillBg = positive ? POP.mint : POP.coral
  const highlight = positive || isWinner || isClosest
  const pointsBg = highlight ? (positive ? POP.mint : POP.coral) : POP.ink

  // Rank rounds: show the guessed order as flags only, bordered right/wrong.
  const isRank = question?.type === 'rank' && Array.isArray(answer)
  // Route rounds: show the attempted journey as a flag chain + any wrong hops.
  const isRoute = question?.type === 'route' && answer != null

  // Map rounds: distance from the true spot reads better than raw coordinates.
  const guessLine = (() => {
    if (answer === undefined || isRank || isRoute) return null
    if (question?.type === 'map' && typeof answer === 'object') {
      if (score >= MAX_SCORE) return 'nailed it 🎯'
      const km = Math.round(haversineKm(answer as LatLng, question.answer))
      return `${km.toLocaleString()} km away`
    }
    // Higher-lower stores the picked side; show the side's label, not "left".
    if (question?.type === 'higher-lower' && (answer === 'left' || answer === 'right')) {
      return `guessed ${question[answer].label}`
    }
    return `guessed ${formatAnswerValue(answer)}`
  })()

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, rotate: index % 2 === 0 ? 2 : -2 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 + index * 0.06 }}
      className="relative flex w-[210px] max-w-full flex-col items-center gap-2 rounded-[28px] bg-white p-4 shadow-pop border-2 border-black"
    >
      {pill && (
        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-pill px-3 py-1 text-xs font-black text-white"
          style={{ background: pillBg, rotate: '-4deg' }}
        >
          {pill}
        </span>
      )}
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-pop-ink"
        style={{ background: stickerFill(player.color) }}
      >
        {Icon && createElement(Icon, { size: 26, className: 'text-pop-ink' })}
      </div>
      <span className="text-[22px] font-black text-pop-ink">{player.name}</span>
      {isRank && question?.type === 'rank' && (
        <RankGuessFlags guess={answer as string[]} answer={question.answer} />
      )}
      {isRoute && answer !== undefined && <RouteGuessFlags answer={answer} />}
      {guessLine && <span className="text-[17px] font-bold text-pop-ink/60">{guessLine}</span>}
      <span
        className="rounded-pill px-4 py-1.5 text-lg font-black text-white"
        style={{ background: pointsBg }}
      >
        {bullseye && !isExact ? '🎯 ' : '+'}
        <CountUp end={score} duration={0.6} separator="" preserveValue />
      </span>
    </motion.div>
  )
}
