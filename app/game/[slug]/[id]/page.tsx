'use client'

import React, { createElement, useEffect, useMemo, useRef, useState } from 'react'
import { Flag, Trophy, Lock, icons as lucideIcons } from 'lucide-react'
import { useRouter } from 'next/navigation'

import QuestionResultModal from '@/app/components/QuestionResultModal'
import { Question } from '@/app/components/Question'
import { AnswerInputModal } from '@/app/components/AnswerInputModa'
import { useGame } from '@/hooks/useGame'
import { useInGameAdsSuppressed } from '@/hooks/useInGameAdsSuppressed'
import { useSupabase } from '@/hooks/useSupabase'
import { useToast } from '@/hooks/use-toast'
import { GameRoomProvider } from '@/app/providers'
import { asSlider, formatAnswerValue, isInputMode } from '@/lib/utils'
import { AnswerValue, LatLng } from '@/app/types'
import { ChoiceOptions } from '@/app/components/geo/ChoiceOptions'
import { HigherLower } from '@/app/components/geo/HigherLower'
import { BuildUp } from '@/app/components/geo/BuildUp'
import { RouteInput } from '@/app/components/geo/RouteInput'
import { ConfidenceBand } from '@/app/components/geo/ConfidenceBand'
import { TypedAnswerInput } from '@/app/components/geo/TypedAnswerInput'
import { MapPicker } from '@/app/components/geo/MapPicker'
import { RankList } from '@/app/components/geo/RankInput'
import { SpeedBonusMeter } from '@/app/components/geo/SpeedBonusMeter'
import { HowToPlayButton, HowToPlayModal } from '@/app/components/HowToPlay'
import { PopShell } from '@/app/components/pop/PopShell'
import { PopLogo } from '@/app/components/pop/PopHeader'
import { PopButton } from '@/app/components/pop/PopButton'
import { PopSlider } from '@/app/components/pop/PopSlider'
import { Dock } from '@/app/components/pop/Dock'
import { POP, stickerFill } from '@/app/components/pop/theme'

function PlayerPageContent({ params }: { params: { slug: string; id: string } }) {
  const { game, send, closeModals } = useGame(params.slug)
  const { suppressed: adsSuppressed } = useInGameAdsSuppressed()
  const { postGameToSupabase } = useSupabase()
  const {
    players,
    amountQuestions,
    currentQuestion,
    command,
    boss,
    me,
    answeredQuestions,
    showQuestions,
    answerModes,
    confidenceMode,
  } = game
  const [answerInputModalOpen, setAnswerInputModalOpen] = useState(false)
  const [currentAnswer, setCurrentAnswer] = useState(0)
  const [isEnding, setIsEnding] = useState(false)
  const [howToOpen, setHowToOpen] = useState(false)
  const router = useRouter()

  const slider = asSlider(currentQuestion)
  const [mapPin, setMapPin] = useState<LatLng | null>(null)
  // Confidence mode: slider band half-width + map circle radius (km).
  const [band, setBand] = useState(0)
  const [radius, setRadius] = useState(0)
  // Rank answer lives here (not in RankInput) so the Lock control can sit inside
  // the host Dock, away from the list. It's a ref, not state: RankList reports its
  // order on every reorder tick, and re-rendering this page mid-drag drops the
  // gesture (the tile snaps back). A ref holds the latest order without a
  // re-render; the Lock reads it at submit time.
  const rankOrderRef = useRef<string[]>([])
  // Timestamp the question was shown; drives the choice speed bonus + meter.
  const [startedAt, setStartedAt] = useState(0)

  useEffect(() => {
    setMapPin(null)
    setStartedAt(performance.now())
    setRadius(Math.round((currentQuestion?.type === 'map' ? currentQuestion.falloffKm ?? 2500 : 2500) / 4))
    if (currentQuestion?.type === 'rank') {
      rankOrderRef.current = currentQuestion.items.map((i) => i.label)
    }
    if (!slider) return
    const mid = (slider.lower_bound + slider.upper_bound) / 2
    setCurrentAnswer(Math.round(mid))
    setBand(Math.round((slider.upper_bound - slider.lower_bound) / 4))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion?.id])

  useEffect(() => {
    if (command === 'end') {
      closeModals()
      router.push(`/game/${params.slug}/end`)
    } else if (command === 'next') {
      closeModals()
    }
  }, [command, params.slug, closeModals, router])

  const playerId = me?.id ?? params.id
  const everyoneHasAnswered = useMemo(
    () => players.every((p) => p.answers.some((a) => a.questionId === currentQuestion?.id)),
    [players, currentQuestion?.id],
  )
  const myPlayerInfo = useMemo(() => players.find((p) => p.id === playerId), [playerId, players])
  const myAnswered = myPlayerInfo?.answers?.some((a) => a.questionId === currentQuestion?.id)
  const myScore = myPlayerInfo?.answers?.reduce((acc, a) => acc + a.score, 0) ?? 0
  const isBoss = boss === playerId
  // The final question has no "next" - once we're on it, the Dock/reveal CTA
  // must switch from "Next" to "Finish"/"End" so the host can't skip forever
  // past the intended question count.
  const canEndGame = (answeredQuestions?.length ?? 0) >= amountQuestions - 1

  const waiting = !currentQuestion || command === 'idle'

  const submit = (
    answer: AnswerValue,
    elapsedMs?: number,
    extra?: { confidence?: number; cluesUsed?: number },
  ) =>
    send('answer', {
      id: playerId,
      answer,
      questionId: currentQuestion.id,
      elapsedMs,
      ...extra,
    })

  const elapsed = () => Math.max(0, Math.round(performance.now() - startedAt))

  return (
    <PopShell bg={POP.cobalt}>
      <header className="flex items-center justify-between gap-2 px-5 pt-5">
        <PopLogo textColor={POP.cobalt} />
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="inline-flex items-center gap-1 rounded-pill bg-white/15 px-2.5 py-1.5 text-sm font-black text-white sm:px-3">
            <Trophy size={14} strokeWidth={2.75} className="sm:hidden" />
            <span className="hidden sm:inline">you: </span>
            {myScore}
            <span className="hidden sm:inline"> pts</span>
          </span>
          <span
            className="rounded-pill border-2 border-white px-2.5 py-1.5 text-sm font-black text-pop-ink sm:px-3"
            style={{ background: POP.sunshine }}
          >
            {(answeredQuestions?.length ?? 0) + 1}
            <span className="hidden sm:inline"> of </span>
            <span className="sm:hidden">/</span>
            {amountQuestions}
          </span>
          <HowToPlayButton tone="light" onClick={() => setHowToOpen(true)} />
        </div>
      </header>

      <main className="mx-auto flex max-w-lg flex-col items-center px-5 pb-72 pt-8">
        {waiting ? (
          <div className="mt-24 flex flex-col items-center gap-4 text-center">
            <div className="text-2xl font-black text-white">Waiting for the game to start…</div>
            <div className="text-4xl">🌀</div>
          </div>
        ) : (
          <>
            {showQuestions && <Question question={currentQuestion} compact />}
            <ReportLink question={currentQuestion?.question} />
            {/* Rank is a tall, variable-height list, so it lives in the scroll
                flow here (not the compact bottom overlay). Its own Lock bar is a
                fixed element rendered from inside RankInput. */}
            {currentQuestion?.type === 'rank' && !myAnswered && (
              <div className="mt-6 w-full max-w-md">
                <RankList
                  items={currentQuestion.items}
                  resetKey={currentQuestion.id}
                  onChange={(o) => {
                    rankOrderRef.current = o
                  }}
                  tone="light"
                />
              </div>
            )}
            {/* Build-up is also tall (clues + typeahead) and commits via its own
                Lock button, so it lives in the scroll flow like rank. */}
            {currentQuestion?.type === 'build-up' && !myAnswered && (
              <div className="mt-6 w-full max-w-md">
                <BuildUp
                  key={currentQuestion.id}
                  question={currentQuestion}
                  onAnswer={(v, ms, extra) => submit(v, ms, extra)}
                />
              </div>
            )}
            {currentQuestion?.type === 'route' && !myAnswered && (
              <div className="mt-6 w-full max-w-md">
                <RouteInput
                  key={currentQuestion.id}
                  question={currentQuestion}
                  onAnswer={(v, ms) => submit(v, ms)}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Bottom stack - extra bottom clearance on the host view so answer
          content sits above the floating Dock. */}
      {!waiting && (
        <div className={`fixed inset-x-0 bottom-0 z-20 px-5 ${isBoss ? 'pb-28' : 'pb-6'}`}>
          <div className="mx-auto max-w-md">
            {myAnswered ? (
              <LockedState
                players={players}
                currentQuestionId={currentQuestion.id}
                value={
                  myPlayerInfo?.answers?.find((a) => a.questionId === currentQuestion.id)?.answer
                }
              />
            ) : (
              <>
                {slider && (
                  <>
                    <PopSlider
                      min={slider.lower_bound}
                      max={slider.upper_bound}
                      value={currentAnswer}
                      onChange={setCurrentAnswer}
                      valueColor={POP.cobalt}
                      onOpenKeypad={() => setAnswerInputModalOpen(true)}
                      compact
                    />
                    {confidenceMode && (
                      <div className="mt-3">
                        <ConfidenceBand
                          label={`How sure? (± ${slider.unit ?? ''})`}
                          min={0}
                          max={Math.round((slider.upper_bound - slider.lower_bound) / 2)}
                          value={band}
                          onChange={setBand}
                        />
                      </div>
                    )}
                  </>
                )}
                {currentQuestion.type === 'map' && (
                  <>
                    <MapPicker
                      value={mapPin}
                      onPick={setMapPin}
                      onConfirm={() =>
                        mapPin &&
                        submit(mapPin, elapsed(), confidenceMode ? { confidence: radius } : undefined)
                      }
                    />
                    {confidenceMode && (
                      <div className="mt-3">
                        <ConfidenceBand
                          label="How wide is your circle? (km)"
                          min={50}
                          max={currentQuestion.falloffKm ?? 2500}
                          value={radius}
                          onChange={setRadius}
                        />
                      </div>
                    )}
                  </>
                )}
                {currentQuestion.type === 'choice' && (
                  <>
                    <SpeedBonusMeter startedAt={startedAt} active={!myAnswered} />
                    {isInputMode(currentQuestion, answerModes) ? (
                      <TypedAnswerInput
                        question={currentQuestion}
                        onAnswer={(v) => submit(v, elapsed())}
                      />
                    ) : (
                      <ChoiceOptions
                        options={currentQuestion.options}
                        onSelect={(opt) => submit(opt, elapsed())}
                      />
                    )}
                  </>
                )}
                {currentQuestion.type === 'odd-one-out' && (
                  <>
                    <SpeedBonusMeter startedAt={startedAt} active={!myAnswered} />
                    <ChoiceOptions
                      options={currentQuestion.options}
                      onSelect={(opt) => submit(opt, elapsed())}
                    />
                  </>
                )}
                {currentQuestion.type === 'higher-lower' && (
                  <>
                    <SpeedBonusMeter startedAt={startedAt} active={!myAnswered} />
                    <HigherLower
                      question={currentQuestion}
                      onSelect={(side) => submit(side, elapsed())}
                    />
                  </>
                )}
                {/* Map has its own Lock control inside MapPicker; this covers slider. */}
                {currentQuestion.type === 'slider' && (
                  <div className="mt-4">
                    <PopButton
                      variant="primary"
                      size="lg"
                      rotate={-1}
                      className="w-full"
                      onClick={() =>
                        submit(
                          currentAnswer,
                          elapsed(),
                          confidenceMode ? { confidence: band } : undefined,
                        )
                      }
                    >
                      Lock it in
                    </PopButton>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {isBoss && !waiting && (
        <Dock
          onReplace={() => send('replace')}
          onNext={() => send('next')}
          onEnd={async () => {
            setIsEnding(true)
            postGameToSupabase()
            await send('end')
          }}
          onLock={() => submit(rankOrderRef.current, elapsed())}
          showLock={currentQuestion?.type === 'rank' && !myAnswered}
          canEndGame={canEndGame}
          ending={isEnding}
        />
      )}

      {/* Player-only devices have no Dock, so their rank Lock is a standalone
          bottom bar. The host locks in from inside the Dock instead. */}
      {!isBoss && !waiting && currentQuestion?.type === 'rank' && !myAnswered && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-30 flex justify-center px-5">
          <PopButton
            variant="primary"
            size="md"
            className="pointer-events-auto shadow-pop-card"
            onClick={() => submit(rankOrderRef.current, elapsed())}
          >
            <Lock size={20} strokeWidth={3} />
            Lock
          </PopButton>
        </div>
      )}

      <AnswerInputModal
        isOpen={answerInputModalOpen}
        onClose={() => setAnswerInputModalOpen(false)}
        onSubmit={(answer: number) => {
          setCurrentAnswer(answer)
          submit(answer, elapsed(), confidenceMode ? { confidence: band } : undefined)
        }}
      />
      <QuestionResultModal
        canEndGame={
          isBoss && everyoneHasAnswered && answeredQuestions?.length === amountQuestions - 1
        }
        send={send}
        adsSuppressed={adsSuppressed}
      />
      <HowToPlayModal isOpen={howToOpen} onClose={() => setHowToOpen(false)} />
    </PopShell>
  )
}

function ReportLink({ question }: { question?: string }) {
  const { reportQuestion } = useSupabase()
  const { toast } = useToast()
  const [reporting, setReporting] = useState(false)
  return (
    <button
      disabled={reporting || !question}
      onClick={async () => {
        setReporting(true)
        try {
          await reportQuestion(question!)
          toast({
            title: 'Reported',
            description: 'Thanks for helping improve the game.',
            duration: 2000,
          })
        } catch {
          toast({
            title: 'Error',
            description: 'Could not report. Try again.',
            variant: 'destructive',
            duration: 2000,
          })
        } finally {
          setReporting(false)
        }
      }}
      className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-white/55 disabled:opacity-40"
    >
      <Flag size={14} /> report this question
    </button>
  )
}

function LockedState({
  players,
  currentQuestionId,
  value,
}: {
  players: any[]
  currentQuestionId: string
  value: AnswerValue | undefined
}) {
  const waitingName = players.find(
    (p) => !p.answers.some((a: any) => a.questionId === currentQuestionId),
  )?.name
  return (
    <div className="flex flex-col items-center gap-3 rounded-card bg-white/15 p-6 text-center">
      <span
        className="rounded-pill bg-white px-5 py-2 text-3xl font-black"
        style={{ color: POP.ink, rotate: '-2deg' }}
      >
        {formatAnswerValue(value)}
      </span>
      <span className="text-3xl font-black text-white">Locked in! ✊</span>
      <span className="text-lg font-bold text-white/70">No takebacks. Sweating yet?</span>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {players.map((p) => {
          const locked = p.answers.some((a: any) => a.questionId === currentQuestionId)
          const Icon = lucideIcons[p.icon as keyof typeof lucideIcons]
          return (
            <div
              key={p.id}
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{
                background: stickerFill(p.color),
                border: locked ? `3px solid ${POP.mint}` : '3px solid rgba(255,255,255,0.3)',
                opacity: locked ? 1 : 0.5,
              }}
            >
              {Icon && createElement(Icon, { size: 22, className: 'text-pop-ink' })}
            </div>
          )
        })}
      </div>
      {waitingName && (
        <span className="text-base font-bold text-white/60">waiting for {waitingName}…</span>
      )}
    </div>
  )
}

export default function PlayerPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const resolvedParams = React.use(params)
  return (
    <GameRoomProvider gameId={resolvedParams.slug}>
      <PlayerPageContent params={resolvedParams} />
    </GameRoomProvider>
  )
}
