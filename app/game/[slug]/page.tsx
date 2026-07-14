'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { RefreshCw, SkipForward, ListEnd } from 'lucide-react'
import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'

import { useGame } from '@/hooks/useGame'
import { asSlider } from '@/lib/utils'
import { LatLng } from '@/app/types'
import { ChoiceOptions } from '@/app/components/geo/ChoiceOptions'
import { WorldMap } from '@/app/components/geo/WorldMap'
import { RankInput } from '@/app/components/geo/RankInput'
import { Player } from '@/app/components/Player'
import { Question } from '@/app/components/Question'
import { Category } from '@/app/components/Category'
import { AnswerInputModal } from '@/app/components/AnswerInputModa'
import QuestionResultModal from '@/app/components/QuestionResultModal'
import { GameRoomProvider } from '@/app/providers'
import { PopShell } from '@/app/components/pop/PopShell'
import { PopLogo } from '@/app/components/pop/PopHeader'
import { PopButton } from '@/app/components/pop/PopButton'
import { PopSlider } from '@/app/components/pop/PopSlider'
import { POP } from '@/app/components/pop/theme'

function GamePageContent({ params }: { params: { slug: string } }) {
  const { game, send, closeModals } = useGame(params.slug)
  const {
    players,
    currentQuestion,
    command,
    answeredQuestions,
    amountQuestions,
    me,
    capAnswers,
  } = game

  const [answerInputModalOpen, setAnswerInputModalOpen] = useState(false)
  const [currentAnswer, setCurrentAnswer] = useState(0)
  const [isEnding, setIsEnding] = useState(false)
  const router = useRouter()

  const myAnswered = players
    .find((p) => p.id === me?.id)
    ?.answers?.some((a) => a.questionId === currentQuestion?.id)

  const everyoneHasAnswered = useMemo(
    () => players.every((p) => p.answers.some((a) => a.questionId === currentQuestion?.id)),
    [players, currentQuestion?.id],
  )

  const slider = asSlider(currentQuestion)
  const [mapPin, setMapPin] = useState<LatLng | null>(null)

  useEffect(() => {
    setMapPin(null)
    if (!slider) return
    const mid = (slider.lower_bound + slider.upper_bound) / 2
    setCurrentAnswer(Math.round(mid))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion?.id])

  const canEndGame = everyoneHasAnswered && answeredQuestions?.length === amountQuestions - 1

  useEffect(() => {
    if (command === 'end') {
      closeModals()
      router.push(`/game/${params.slug}/end`)
    } else if (command === 'next') {
      closeModals()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [command])

  return (
    <PopShell bg={POP.cobalt}>
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 pt-5 md:px-12 md:pt-8">
        <PopLogo textColor={POP.cobalt} />
        <div className="flex items-center gap-3">
          {currentQuestion && (
            <Category
              question={currentQuestion}
              bg={POP.sunshine}
              className="rotate-2 border-[3px] border-white text-base"
            />
          )}
          <span className="rounded-pill bg-white px-4 py-2 text-base font-black text-pop-ink">
            {(answeredQuestions?.length ?? 0) + 1} of {amountQuestions}
          </span>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col items-center px-5 pb-64 pt-8 md:pt-14">
        <Question question={currentQuestion} />

        {/* Player stickers */}
        <div className="mt-14 flex flex-wrap justify-center gap-5">
          {players.map((p, index) => (
            <Player key={p.id} {...p} index={index} showScore send={send} />
          ))}
        </div>
      </main>

      {/* Bottom control dock */}
      <div className="fixed inset-x-0 bottom-0 z-20 px-5 pb-6">
        <div className="mx-auto max-w-2xl">
          {me?.localPlayer && !myAnswered && slider && (
            <div className="mb-4">
              <PopSlider
                min={slider.lower_bound}
                max={slider.upper_bound}
                value={currentAnswer}
                onChange={setCurrentAnswer}
                valueColor={POP.cobalt}
                locked={myAnswered}
                onOpenKeypad={() => setAnswerInputModalOpen(true)}
              />
            </div>
          )}
          {me?.localPlayer && !myAnswered && currentQuestion?.type === 'map' && (
            <div className="mb-4 overflow-hidden rounded-[20px] border-4 border-pop-ink">
              <WorldMap value={mapPin} onPick={setMapPin} />
            </div>
          )}
          {me?.localPlayer && !myAnswered && currentQuestion?.type === 'choice' && (
            <div className="mb-4">
              <ChoiceOptions
                options={currentQuestion.options}
                onSelect={(opt) =>
                  send('answer', { id: me?.id, answer: opt, questionId: currentQuestion.id })
                }
              />
            </div>
          )}
          {me?.localPlayer && !myAnswered && currentQuestion?.type === 'rank' && (
            <div className="mb-4">
              <RankInput
                question={currentQuestion}
                onAnswer={(v, ms) =>
                  send('answer', { id: me?.id, answer: v, questionId: currentQuestion.id, elapsedMs: ms })
                }
              />
            </div>
          )}

          <div className="flex items-center justify-center gap-3">
            <PopButton variant="ghostLight" size="sm" onClick={() => send('replace')}>
              <RefreshCw size={20} /> Replace
            </PopButton>

            {me?.localPlayer &&
              !myAnswered &&
              currentQuestion &&
              currentQuestion.type !== 'choice' &&
              currentQuestion.type !== 'rank' && (
              <PopButton
                variant="primary"
                size="lg"
                rotate={-1}
                className="flex-1"
                disabled={currentQuestion.type === 'map' && !mapPin}
                onClick={() =>
                  send('answer', {
                    id: me?.id,
                    answer: currentQuestion.type === 'map' ? mapPin! : currentAnswer,
                    questionId: currentQuestion.id,
                  })
                }
              >
                Lock it in ✊
              </PopButton>
            )}

            {canEndGame ? (
              <PopButton
                variant="secondary"
                size="sm"
                disabled={isEnding}
                onClick={async () => {
                  setIsEnding(true)
                  await send('end')
                  router.push(`/game/${params.slug}/end`)
                }}
              >
                {isEnding ? 'Ending…' : <>End game <ListEnd size={20} /></>}
              </PopButton>
            ) : (
              <PopButton variant="ghostLight" size="sm" onClick={() => send('next')}>
                <SkipForward size={20} /> Next
              </PopButton>
            )}
          </div>
        </div>
      </div>

      <AnswerInputModal
        isOpen={answerInputModalOpen}
        onClose={() => setAnswerInputModalOpen(false)}
        onSubmit={(answer: number) => {
          setCurrentAnswer(answer)
          send('answer', {
            id: me?.id,
            answer,
            questionId: currentQuestion.id,
          })
        }}
      />
      <QuestionResultModal canEndGame={canEndGame} send={send} />
    </PopShell>
  )
}

export default function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = React.use(params)
  return (
    <GameRoomProvider gameId={resolvedParams.slug}>
      <GamePageContent params={resolvedParams} />
    </GameRoomProvider>
  )
}
