'use client'

import { TPlayer, TQuestion } from '../types'
import { formatAnswerValue } from '@/lib/utils'
import { PlayerResult } from './PlayerResult'
import { Category } from './Category'
import { POP } from './pop/theme'

export const QuestionResult = ({
  players,
  question,
  index,
}: {
  players: TPlayer[]
  question: TQuestion
  index: number
}) => {
  return (
    <div
      key={question.id}
      className="mx-auto w-full max-w-[640px] rounded-card bg-white p-6 shadow-pop-card"
      style={{ rotate: index % 2 === 0 ? '1deg' : '-1deg' }}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-2xl font-black text-pop-ink">Question {index + 1}</h3>
        <Category question={question} />
      </div>
      <p className="mb-4 text-xl font-bold text-pop-ink">{question.question}</p>
      <span
        className="inline-block rounded-pill border-2 border-pop-ink px-4 py-1.5 text-lg font-black text-pop-ink"
        style={{ background: POP.sunshine }}
      >
        Answer: {formatAnswerValue(question.answer)}
      </span>
      <div className="mt-6 flex flex-wrap justify-center gap-4">
        {players.map((player, i) => {
          const answer = player.answers.find((a) => a.questionId === question.id)
          if (!answer) return null
          return (
            <PlayerResult
              key={player.id}
              index={i}
              player={player}
              score={answer.score}
              answer={answer.answer}
              isClosest={i === 0}
            />
          )
        })}
      </div>
    </div>
  )
}
