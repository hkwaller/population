'use client'

import { LatLng, TPlayer, TQuestion } from '../types'
import { formatAnswerValue } from '@/lib/utils'
import { PlayerResult } from './PlayerResult'
import { Category } from './Category'
import { RankAnswerFlags } from './geo/RankFlags'
import { WorldMap, type MapPin } from './geo/WorldMap'
import { POP, stickerFill } from './pop/theme'

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
      {question.type === 'rank' ? (
        <RankAnswerFlags answer={question.answer} />
      ) : question.type === 'map' ? (
        <div className="overflow-hidden rounded-[20px] border-4 border-pop-ink">
          <WorldMap
            answer={question.answer}
            pins={
              players
                .map((player) => {
                  const guess = player.answers.find((a) => a.questionId === question.id)?.answer
                  return guess && typeof guess === 'object'
                    ? { point: guess as LatLng, color: stickerFill(player.color) }
                    : null
                })
                .filter(Boolean) as MapPin[]
            }
            interactive={false}
          />
        </div>
      ) : (
        <span
          className="inline-block rounded-pill border-2 border-pop-ink px-4 py-1.5 text-lg font-black text-pop-ink"
          style={{ background: POP.sunshine }}
        >
          Answer: {formatAnswerValue(question.answer)}
        </span>
      )}
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
              question={question}
              isClosest={i === 0}
            />
          )
        })}
      </div>
    </div>
  )
}
