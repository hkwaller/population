'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { useGame } from '@/hooks/useGame'
import { asSlider, isInputMode } from '@/lib/utils'
import { LatLng } from '@/app/types'
import { ChoiceOptions } from '@/app/components/geo/ChoiceOptions'
import { TypedAnswerInput } from '@/app/components/geo/TypedAnswerInput'
import { WorldMap } from '@/app/components/geo/WorldMap'
import { RankList } from '@/app/components/geo/RankInput'
import { SpeedBonusMeter } from '@/app/components/geo/SpeedBonusMeter'
import { Player } from '@/app/components/Player'
import { Question } from '@/app/components/Question'
import { Category } from '@/app/components/Category'
import { HowToPlayButton, HowToPlayModal } from '@/app/components/HowToPlay'
import { AnswerInputModal } from '@/app/components/AnswerInputModa'
import QuestionResultModal from '@/app/components/QuestionResultModal'
import { GameRoomProvider } from '@/app/providers'
import { PopShell } from '@/app/components/pop/PopShell'
import { PopLogo } from '@/app/components/pop/PopHeader'
import { PopButton } from '@/app/components/pop/PopButton'
import { PopSlider } from '@/app/components/pop/PopSlider'
import { Dock } from '@/app/components/pop/Dock'
import { POP } from '@/app/components/pop/theme'

function GamePageContent({ params }: { params: { slug: string } }) {
  const { game, send, closeModals } = useGame(params.slug)
  const { players, currentQuestion, command, answeredQuestions, amountQuestions, me, answerModes } =
    game

  const [answerInputModalOpen, setAnswerInputModalOpen] = useState(false)
  const [currentAnswer, setCurrentAnswer] = useState(0)
  const [isEnding, setIsEnding] = useState(false)
  const [howToOpen, setHowToOpen] = useState(false)
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
  // Rank answer lives here (not in RankInput) so Lock can sit in the Dock.
  const [rankOrder, setRankOrder] = useState<string[]>([])
  // Timestamp the question was shown; drives the choice speed bonus + meter.
  const [startedAt, setStartedAt] = useState(0)

  useEffect(() => {
    setMapPin(null)
    setStartedAt(performance.now())
    if (currentQuestion?.type === 'rank') {
      setRankOrder(currentQuestion.items.map((i) => i.label))
    }
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
      <header className="flex items-center justify-between gap-2 px-5 pt-5 md:px-12 md:pt-8">
        <PopLogo textColor={POP.cobalt} />
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Rank states its category in the prompt, so the chip would just
              repeat it - hide it for rank (and on the smallest screens it's
              decorative, so keep it to sm+ to leave room for the count pill). */}
          {currentQuestion && currentQuestion.type !== 'rank' && (
            <Category
              question={currentQuestion}
              bg={POP.sunshine}
              className="hidden rotate-2 border-[3px] border-white text-base sm:inline-block"
            />
          )}
          <span className="rounded-pill bg-white px-3 py-2 text-base font-black text-pop-ink sm:px-4">
            {(answeredQuestions?.length ?? 0) + 1}/{amountQuestions}
          </span>
          <HowToPlayButton tone="light" onClick={() => setHowToOpen(true)} />
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col items-center px-5 pb-64 pt-8 md:pt-14">
        <Question question={currentQuestion} />

        {/* Rank is a tall, variable-height list, so it sits in the scroll flow
            here (not the fixed bottom overlay). Lock lives in the Dock below. */}
        {me?.localPlayer && !myAnswered && currentQuestion?.type === 'rank' && (
          <div className="mt-8 w-full max-w-md">
            <RankList
              items={currentQuestion.items}
              resetKey={currentQuestion.id}
              onChange={setRankOrder}
              tone="light"
            />
          </div>
        )}

        {/* Player stickers */}
        <div className="mt-14 flex flex-wrap justify-center gap-5">
          {players.map((p, index) => (
            <Player key={p.id} {...p} index={index} showScore send={send} />
          ))}
        </div>
      </main>

      {/* Answer input area - host game-flow controls now live in <Dock />.
          Extra bottom clearance so inputs sit above the floating Dock. */}
      <div className="fixed inset-x-0 bottom-0 z-20 px-5 pb-28">
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
              <SpeedBonusMeter startedAt={startedAt} active={!myAnswered} />
              {isInputMode(currentQuestion, answerModes) ? (
                <TypedAnswerInput
                  question={currentQuestion}
                  onAnswer={(v) =>
                    send('answer', {
                      id: me?.id,
                      answer: v,
                      questionId: currentQuestion.id,
                      elapsedMs: Math.max(0, Math.round(performance.now() - startedAt)),
                    })
                  }
                />
              ) : (
                <ChoiceOptions
                  options={currentQuestion.options}
                  onSelect={(opt) =>
                    send('answer', {
                      id: me?.id,
                      answer: opt,
                      questionId: currentQuestion.id,
                      elapsedMs: Math.max(0, Math.round(performance.now() - startedAt)),
                    })
                  }
                />
              )}
            </div>
          )}
          {me?.localPlayer &&
            !myAnswered &&
            currentQuestion &&
            currentQuestion.type !== 'choice' &&
            currentQuestion.type !== 'rank' && (
              <PopButton
                variant="primary"
                size="lg"
                rotate={-1}
                className="w-full"
                disabled={currentQuestion.type === 'map' && !mapPin}
                onClick={() =>
                  send('answer', {
                    id: me?.id,
                    answer: currentQuestion.type === 'map' ? mapPin! : currentAnswer,
                    questionId: currentQuestion.id,
                  })
                }
              >
                Lock it in
              </PopButton>
            )}
        </div>
      </div>

      {currentQuestion && (
        <Dock
          onReplace={() => send('replace')}
          onNext={() => send('next')}
          onEnd={async () => {
            setIsEnding(true)
            await send('end')
            router.push(`/game/${params.slug}/end`)
          }}
          onLock={() =>
            send('answer', {
              id: me?.id,
              answer: rankOrder,
              questionId: currentQuestion.id,
              elapsedMs: Math.max(0, Math.round(performance.now() - startedAt)),
            })
          }
          showLock={me?.localPlayer && !myAnswered && currentQuestion?.type === 'rank'}
          canEndGame={canEndGame}
          ending={isEnding}
        />
      )}

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
      <HowToPlayModal isOpen={howToOpen} onClose={() => setHowToOpen(false)} />
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
