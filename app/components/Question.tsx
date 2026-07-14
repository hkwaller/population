'use client'

import { motion } from 'motion/react'

import { TQuestion } from '../types'
import { Category } from './Category'

export const Question = ({
  question,
  compact = false,
}: {
  question: TQuestion
  showAnswer?: boolean
  compact?: boolean
}) => {
  if (!question) return null

  return (
    <motion.div
      key={question.id}
      initial={{ x: '-20vw', opacity: 0, rotate: -1.5 }}
      animate={{ x: 0, opacity: 1, rotate: -1.5 }}
      exit={{ x: '20vw', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      className={`relative mx-auto w-full bg-white shadow-pop-card ${
        compact
          ? 'max-w-[520px] rounded-[28px] px-6 py-8'
          : 'max-w-[760px] rounded-[40px] px-8 py-12 md:px-[72px] md:py-14'
      }`}
    >
      <div className="absolute -top-3.5 left-6">
        <Category question={question} className="rotate-[-3deg] shadow-pop-sm" />
      </div>
      <p
        className="text-center font-black leading-tight tracking-[-0.01em] text-pop-ink"
        style={{
          fontSize: compact ? 'clamp(20px, 6vw, 27px)' : 'clamp(28px, 5vw, 56px)',
        }}
      >
        {question.question}
      </p>
    </motion.div>
  )
}
