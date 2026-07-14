'use client'

import React, { createElement, useEffect, useMemo, useState } from 'react'
import { RefreshCw, SkipForward, Flag, icons as lucideIcons } from 'lucide-react'
import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'

import QuestionResultModal from '@/app/components/QuestionResultModal'
import { Question } from '@/app/components/Question'
import { AnswerInputModal } from '@/app/components/AnswerInputModa'
import { useGame } from '@/hooks/useGame'
import { useSupabase } from '@/hooks/useSupabase'
import { useToast } from '@/hooks/use-toast'
import { GameRoomProvider } from '@/app/providers'
import { asSlider } from '@/lib/utils'
import { AnswerValue } from '@/app/types'
import { PopShell } from '@/app/components/pop/PopShell'
import { PopLogo } from '@/app/components/pop/PopHeader'
import { PopButton } from '@/app/components/pop/PopButton'
import { PopSlider } from '@/app/components/pop/PopSlider'
import { POP, stickerFill } from '@/app/components/pop/theme'

function PlayerPageContent({ params }: { params: { slug: string; id: string } }) {
  const { game, send, closeModals } = useGame(params.slug)
  const {
    players,
    amountQuestions,
    currentQuestion,
    command,
    boss,
    me,
    answeredQuestions,
    capAnswers,
    hideQuestions,
  } = game
  const [answerInputModalOpen, setAnswerInputModalOpen] = useState(false)
  const [currentAnswer, setCurrentAnswer] = useState(0)
  const router = useRouter()

  const slider = asSlider(currentQuestion)

  useEffect(() => {
    if (!slider) return
    const mid = (slider.lower_bound + slider.upper_bound) / 2
    setCurrentAnswer(Math.round(mid))
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
  const showReplace = (game.customQuestions?.length || 0) === 0

  const waiting = !currentQuestion || command === 'idle'

  const submit = (answer: AnswerValue, elapsedMs?: number) =>
    send('answer', {
      id: playerId,
      answer,
      questionId: currentQuestion.id,
      elapsedMs,
    })

  return (
    <PopShell bg={POP.cobalt}>
      <header className="flex items-center justify-between px-5 pt-5">
        <PopLogo textColor={POP.cobalt} />
        <div className="flex items-center gap-2">
          <span className="rounded-pill bg-white/15 px-3 py-1.5 text-sm font-black text-white">
            you: {myScore} pts
          </span>
          <span
            className="rounded-pill border-2 border-white px-3 py-1.5 text-sm font-black text-pop-ink"
            style={{ background: POP.sunshine }}
          >
            {(answeredQuestions?.length ?? 0) + 1} of {amountQuestions}
          </span>
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
            {!hideQuestions && <Question question={currentQuestion} compact />}
            <ReportLink question={currentQuestion?.question} />
          </>
        )}
      </main>

      {/* Bottom stack */}
      {!waiting && (
        <div className="fixed inset-x-0 bottom-0 z-20 px-5 pb-6">
          <div className="mx-auto max-w-md">
            {myAnswered ? (
              <LockedState players={players} currentQuestionId={currentQuestion.id} value={currentAnswer} />
            ) : (
              <>
                <PopSlider
                  min={slider?.lower_bound ?? 0}
                  max={slider?.upper_bound ?? 100}
                  value={currentAnswer}
                  onChange={setCurrentAnswer}
                  valueColor={POP.cobalt}
                  onOpenKeypad={() => setAnswerInputModalOpen(true)}
                  compact
                />
                <div className="mt-4 flex items-center gap-3">
                  {showReplace && (
                    <CircleBtn color={POP.mint} onClick={() => send('replace')} label="Replace question">
                      <RefreshCw size={22} strokeWidth={2.5} />
                    </CircleBtn>
                  )}
                  {isBoss && (
                    <CircleBtn color={POP.grape} onClick={() => send('next')} label="Next question">
                      <SkipForward size={22} strokeWidth={2.5} color="#fff" />
                    </CircleBtn>
                  )}
                  <PopButton
                    variant="primary"
                    size="lg"
                    rotate={-1}
                    className="flex-1"
                    onClick={() => submit(currentAnswer)}
                  >
                    Lock it in ✊
                  </PopButton>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <AnswerInputModal
        isOpen={answerInputModalOpen}
        onClose={() => setAnswerInputModalOpen(false)}
        onSubmit={(answer: number) => {
          setCurrentAnswer(answer)
          submit(answer)
        }}
      />
      <QuestionResultModal canEndGame={isBoss && everyoneHasAnswered && answeredQuestions?.length === amountQuestions - 1} send={send} />
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
          toast({ title: 'Reported', description: 'Thanks for helping improve the game.', duration: 2000 })
        } catch {
          toast({ title: 'Error', description: 'Could not report. Try again.', variant: 'destructive', duration: 2000 })
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

function CircleBtn({
  color,
  onClick,
  label,
  children,
}: {
  color: string
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      aria-label={label}
      className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full border-[3px] border-white text-pop-ink shadow-pop-sm"
      style={{ background: color }}
    >
      {children}
    </motion.button>
  )
}

function LockedState({
  players,
  currentQuestionId,
  value,
}: {
  players: any[]
  currentQuestionId: string
  value: number
}) {
  const waitingName = players.find((p) => !p.answers.some((a: any) => a.questionId === currentQuestionId))?.name
  return (
    <div className="flex flex-col items-center gap-3 rounded-card bg-white/15 p-6 text-center">
      <span
        className="rounded-pill bg-white px-5 py-2 text-3xl font-black"
        style={{ color: POP.ink, rotate: '-2deg' }}
      >
        {value}
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
      {waitingName && <span className="text-base font-bold text-white/60">waiting for {waitingName}…</span>}
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
