'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { useGame } from '@/hooks/useGame'
import { useSupabase } from '@/hooks/useSupabase'
import { asSlider, isInputMode } from '@/lib/utils'
import { LatLng } from '@/app/types'
import { ChoiceOptions } from '@/app/components/geo/ChoiceOptions'
import { HigherLower } from '@/app/components/geo/HigherLower'
import { BuildUp } from '@/app/components/geo/BuildUp'
import { RouteInput } from '@/app/components/geo/RouteInput'
import { TypedAnswerInput } from '@/app/components/geo/TypedAnswerInput'
import { WorldMap } from '@/app/components/geo/WorldMap'
import { RankModal } from '@/app/components/geo/RankModal'
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
import { TvScoreboard, useTvStage } from '@/app/components/pop/tv'
import { useCastToTv } from '@/hooks/useNative'

function GamePageContent({ params, tv }: { params: { slug: string }; tv: boolean }) {
  const { game, send, closeModals } = useGame(params.slug)
  const { postGameToSupabase } = useSupabase()
  const { players, currentQuestion, command, answeredQuestions, amountQuestions, me, answerModes } =
    game

  const [answerInputModalOpen, setAnswerInputModalOpen] = useState(false)
  const [currentAnswer, setCurrentAnswer] = useState(0)
  const [isEnding, setIsEnding] = useState(false)
  const [howToOpen, setHowToOpen] = useState(false)
  const router = useRouter()
  // iOS app: the host's screen goes on an AirPlay TV (see setup page).
  useCastToTv(tv ? null : `/game/${params.slug}`)
  const stage = useTvStage(tv)

  const myAnswered = players
    .find((p) => p.id === me?.id)
    ?.answers?.some((a) => a.questionId === currentQuestion?.id)

  const slider = asSlider(currentQuestion)
  const [mapPin, setMapPin] = useState<LatLng | null>(null)
  // Timestamp the question was shown; drives the choice speed bonus + meter.
  const [startedAt, setStartedAt] = useState(0)

  useEffect(() => {
    setMapPin(null)
    setStartedAt(performance.now())
    if (!slider) return
    const mid = (slider.lower_bound + slider.upper_bound) / 2
    setCurrentAnswer(Math.round(mid))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion?.id])

  // The final question has no "next" - once we're on it, the Dock/reveal CTA
  // must switch from "Next" to "Finish"/"End" so the host can't skip forever
  // past the intended question count.
  const canEndGame = (answeredQuestions?.length ?? 0) >= amountQuestions - 1

  useEffect(() => {
    if (command === 'end') {
      closeModals()
      router.push(`/game/${params.slug}/end${tv ? '?view=tv' : ''}`)
    } else if (command === 'next') {
      closeModals()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [command])

  return (
    <PopShell bg={POP.cobalt}>
      {/* On the TV: a 1280×720 stage zoomed to the screen - question on the
          left, a live scoreboard on the right. Elsewhere `contents` keeps the
          normal scrolling page. */}
      <div
        className={tv ? 'flex flex-col' : 'contents'}
        style={stage ? { zoom: stage.zoom, height: stage.height } : undefined}
      >
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
            {!tv && <HowToPlayButton tone="light" onClick={() => setHowToOpen(true)} />}
          </div>
        </header>

        <main
          className={
            tv
              ? 'grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_300px] items-center gap-12 px-12 pb-10'
              : 'mx-auto flex max-w-3xl flex-col items-center px-5 pb-64 pt-8 md:pt-14'
          }
        >
          <div className={tv ? 'flex flex-col items-center' : 'contents'}>
            <Question question={currentQuestion} />

            {/* Big-screen mirror of the answer options: multiple-choice rounds must
            always show their alternatives up top so spectators (and remote
            players) can follow along, even when this device isn't playing. Shown
            whenever the interactive input isn't (host not playing, or the local
            player already answered). Read-only. Rank is excluded on purpose. */}
            {currentQuestion && !(me?.localPlayer && !myAnswered) && (
              <>
                {currentQuestion.type === 'choice' &&
                  !isInputMode(currentQuestion, answerModes) && (
                    <div className={tv ? 'mt-10 w-full max-w-2xl' : 'mt-8 w-full max-w-md'}>
                      <ChoiceOptions options={currentQuestion.options} disabled />
                    </div>
                  )}
                {currentQuestion.type === 'odd-one-out' && (
                  <div className={tv ? 'mt-10 w-full max-w-2xl' : 'mt-8 w-full max-w-md'}>
                    <ChoiceOptions options={currentQuestion.options} disabled />
                  </div>
                )}
                {currentQuestion.type === 'higher-lower' && (
                  <div className={tv ? 'mt-10 w-full max-w-2xl' : 'mt-8 w-full max-w-md'}>
                    <HigherLower question={currentQuestion} disabled />
                  </div>
                )}
                {/* Build-up ("Name It"): mirror the dripping clues so spectators and
                already-answered players can follow along. Read-only, no input. */}
                {currentQuestion.type === 'build-up' && (
                  <div className={tv ? 'mt-10 w-full max-w-2xl' : 'mt-8 w-full max-w-md'}>
                    <BuildUp key={currentQuestion.id} question={currentQuestion} readOnly />
                  </div>
                )}
              </>
            )}

            {/* Rank opens its own full-screen drag modal (portalled to <body>) so the
            reorder gesture never fights this page's scroll or re-renders. It
            commits directly via onLock - no Dock lock needed. */}
            {me?.localPlayer && !myAnswered && currentQuestion?.type === 'rank' && (
              <RankModal
                key={currentQuestion.id}
                question={currentQuestion}
                onLock={(order) =>
                  send('answer', {
                    id: me?.id,
                    answer: order,
                    questionId: currentQuestion.id,
                    elapsedMs: Math.max(0, Math.round(performance.now() - startedAt)),
                  })
                }
              />
            )}

            {/* Build-up ("Name It") and route ("Border Hopper") are tall (clues +
            typeahead / chain builder) and commit via their own Lock button, so
            they live in the scroll flow like rank rather than the bottom overlay. */}
            {me?.localPlayer && !myAnswered && currentQuestion?.type === 'build-up' && (
              <div className={tv ? 'mt-10 w-full max-w-2xl' : 'mt-8 w-full max-w-md'}>
                <BuildUp
                  key={currentQuestion.id}
                  question={currentQuestion}
                  onAnswer={(v, ms, extra) =>
                    send('answer', {
                      id: me?.id,
                      answer: v,
                      questionId: currentQuestion.id,
                      elapsedMs: ms,
                      ...extra,
                    })
                  }
                />
              </div>
            )}
            {me?.localPlayer && !myAnswered && currentQuestion?.type === 'route' && (
              <div className={tv ? 'mt-10 w-full max-w-2xl' : 'mt-8 w-full max-w-md'}>
                <RouteInput
                  key={currentQuestion.id}
                  question={currentQuestion}
                  onAnswer={(v, ms) =>
                    send('answer', {
                      id: me?.id,
                      answer: v,
                      questionId: currentQuestion.id,
                      elapsedMs: ms,
                    })
                  }
                />
              </div>
            )}
          </div>

          {/* Player stickers (the TV gets a ranked scoreboard instead) */}
          {tv ? (
            <TvScoreboard />
          ) : (
            <div className="mt-14 flex flex-wrap justify-center gap-5">
              {players.map((p, index) => (
                <Player key={p.id} {...p} index={index} showScore send={tv ? undefined : send} />
              ))}
            </div>
          )}
        </main>
      </div>

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
          {me?.localPlayer && !myAnswered && currentQuestion?.type === 'odd-one-out' && (
            <div className="mb-4">
              <SpeedBonusMeter startedAt={startedAt} active={!myAnswered} />
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
            </div>
          )}
          {me?.localPlayer && !myAnswered && currentQuestion?.type === 'higher-lower' && (
            <div className="mb-4">
              <SpeedBonusMeter startedAt={startedAt} active={!myAnswered} />
              <HigherLower
                question={currentQuestion}
                onSelect={(side) =>
                  send('answer', {
                    id: me?.id,
                    answer: side,
                    questionId: currentQuestion.id,
                    elapsedMs: Math.max(0, Math.round(performance.now() - startedAt)),
                  })
                }
              />
            </div>
          )}
          {me?.localPlayer &&
            !myAnswered &&
            currentQuestion &&
            currentQuestion.type !== 'choice' &&
            currentQuestion.type !== 'odd-one-out' &&
            currentQuestion.type !== 'higher-lower' &&
            currentQuestion.type !== 'build-up' &&
            currentQuestion.type !== 'route' &&
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

      {currentQuestion && !tv && (
        <Dock
          onReplace={() => send('replace')}
          onNext={() => send('next')}
          onEnd={async () => {
            setIsEnding(true)
            postGameToSupabase()
            await send('end')
            router.push(`/game/${params.slug}/end`)
          }}
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
      <QuestionResultModal
        canEndGame={canEndGame}
        send={tv ? undefined : send}
        adsSuppressed={tv}
        tv={tv}
      />
      <HowToPlayModal isOpen={howToOpen} onClose={() => setHowToOpen(false)} />
    </PopShell>
  )
}

export default function GamePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ view?: string }>
}) {
  const resolvedParams = React.use(params)
  // `?view=tv`: the display-only copy the iOS app puts on an AirPlay TV (NATIVE.md).
  const tv = React.use(searchParams).view === 'tv'
  return (
    <GameRoomProvider gameId={resolvedParams.slug}>
      <GamePageContent params={resolvedParams} tv={tv} />
    </GameRoomProvider>
  )
}
