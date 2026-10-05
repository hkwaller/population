'use client'

import { useState, type ReactNode } from 'react'

import type { AnswerValue, TQuestion } from '@/app/types'
import { usePopStore } from '@/app/state'
import { formatAnswerValue } from '@/lib/utils'
import { scoreGuess } from '@/lib/geo/score'
import { PopShell } from '@/app/components/pop/PopShell'
import { PopButton } from '@/app/components/pop/PopButton'
import { PopToggle } from '@/app/components/pop/PopControls'
import { POP } from '@/app/components/pop/theme'
import { Question } from '@/app/components/Question'
import { QuestionInput } from '@/app/components/geo/QuestionInput'
import { ChoiceOptions } from '@/app/components/geo/ChoiceOptions'
import { HigherLower } from '@/app/components/geo/HigherLower'
import { RankReveal } from '@/app/components/geo/RankReveal'
import { RouteReveal } from '@/app/components/geo/RouteReveal'
import { RouteGuessFlags } from '@/app/components/geo/RouteFlags'
import { WorldMap, mapDistanceKm } from '@/app/components/geo/WorldMap'
import { useHaptic } from '@/hooks/useNative'

/** `confidence` is the band half-width / map radius, when confidence mode is on. */
export type Attempt = { value: AnswerValue; score: number; confidence?: number }

/**
 * One run over a fixed list of questions: question, answer, reveal, next. The
 * daily (DailyGame) and the app's offline practice round (native/offline) both
 * play through this; what happens with the attempts at the end is up to them.
 * It imports nothing network-bound, so the offline island can bundle it.
 */
export function DailyRound({
  questions,
  label,
  logo,
  onFinish,
}: {
  questions: TQuestion[]
  /** Badge text before the counter, e.g. "Daily". */
  label: string
  logo: ReactNode
  onFinish: (attempts: Attempt[]) => void
}) {
  // Device-local confidence-mode preference. Daily has no setup screen, so the
  // toggle rides along on the first question and locks once you've answered it -
  // switching scoring rules mid-run would make the shareable grid meaningless.
  const confidenceMode = usePopStore((s) => s.confidenceMode)
  const updateGame = usePopStore((s) => s.updateGame)
  const hasBandQuestion = questions.some((q) => q.type === 'slider' || q.type === 'map')

  const [index, setIndex] = useState(0)
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [revealing, setRevealing] = useState<Attempt | null>(null)

  const onAnswer = (
    value: AnswerValue,
    elapsedMs: number,
    extra?: { confidence?: number; cluesUsed?: number },
  ) => {
    const q = questions[index]
    setRevealing({
      value,
      score: scoreGuess(q, value, elapsedMs, extra),
      confidence: extra?.confidence,
    })
  }

  const next = () => {
    if (!revealing) return
    const nextAttempts = [...attempts, revealing]
    setAttempts(nextAttempts)
    setRevealing(null)
    if (index + 1 >= questions.length) onFinish(nextAttempts)
    else setIndex(index + 1)
  }

  const q = questions[index]

  return (
    <PopShell bg={POP.cobalt}>
      <header className="flex items-center justify-between px-5 pt-5">
        {logo}
        <span
          className="rounded-pill border-2 border-white px-3 py-1.5 text-sm font-black text-pop-ink"
          style={{ background: POP.sunshine }}
        >
          {label} · {index + 1}/{questions.length}
        </span>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 px-5 pb-16 pt-8">
        <Question question={q} compact />

        {revealing ? (
          <div className="w-full">
            <Reveal question={q} attempt={revealing} />
            <PopButton variant="primary" size="lg" className="mt-5 w-full" onClick={next}>
              {index + 1 >= questions.length ? 'See results' : 'Next'}
            </PopButton>
          </div>
        ) : (
          <div className="w-full">
            {index === 0 && hasBandQuestion && (
              <div className="mb-4 flex items-center justify-between gap-4 rounded-3xl bg-white px-5 py-3 shadow-pop">
                <div className="min-w-0">
                  <span className="block text-base font-black text-pop-ink">Confidence mode</span>
                  <span className="block text-sm font-bold text-pop-ink/55">
                    Bet a range - narrow scores more, miss it and you get nothing
                  </span>
                </div>
                <PopToggle
                  compact
                  checked={confidenceMode}
                  onChange={(v) => updateGame({ confidenceMode: v })}
                />
              </div>
            )}
            <QuestionInput question={q} onAnswer={onAnswer} />
          </div>
        )}
      </main>
    </PopShell>
  )
}

function Reveal({ question, attempt }: { question: TQuestion; attempt: Attempt }) {
  // Same good/bad line as the score pill below.
  useHaptic(attempt.score >= 550 ? 'right' : 'wrong', question.id)

  return (
    <div className="flex flex-col items-center gap-4 rounded-card bg-white p-6 shadow-pop-card">
      {question.type === 'map' && (
        <>
          <div className="w-full overflow-hidden rounded-[20px] border-4 border-pop-ink">
            <WorldMap
              value={attempt.value as { lat: number; lng: number }}
              answer={question.answer}
              interactive={false}
            />
          </div>
          <p className="text-lg font-black text-pop-ink">
            {mapDistanceKm(attempt.value as { lat: number; lng: number }, question.answer)} km away
          </p>
        </>
      )}
      {question.type === 'choice' && (
        <ChoiceOptions
          options={question.options}
          selected={attempt.value as string}
          correct={question.answer}
        />
      )}
      {question.type === 'rank' && (
        <RankReveal question={question} guess={attempt.value as string[]} />
      )}
      {question.type === 'higher-lower' && (
        <HigherLower question={question} selected={attempt.value as 'left' | 'right'} reveal />
      )}
      {question.type === 'odd-one-out' && (
        <>
          <ChoiceOptions
            options={question.options}
            selected={attempt.value as string}
            correct={question.answer}
          />
          <p className="text-center text-base font-bold text-pop-ink/60">
            The others {question.sharedProperty}.
          </p>
        </>
      )}
      {question.type === 'build-up' && (
        <p className="text-center text-xl font-black text-pop-ink">
          Answer: {question.answer}
          <br />
          <span className="text-pop-ink/60">You: {formatAnswerValue(attempt.value)}</span>
        </p>
      )}
      {question.type === 'route' && (
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[11px] font-black uppercase tracking-wide text-pop-ink/50">
              Your route
            </span>
            <RouteGuessFlags answer={attempt.value} />
          </div>
          <RouteReveal question={question} />
        </div>
      )}
      {question.type === 'slider' && (
        <p className="text-center text-xl font-black text-pop-ink">
          Answer: {formatAnswerValue(question.answer)}
          {question.unit ? ` ${question.unit}` : ''}
          <br />
          {/* In confidence mode the bet was a range, so echo the range - showing
              only its midpoint would look like a guess the player never made. */}
          <span className="text-pop-ink/60">
            You:{' '}
            {attempt.confidence != null && typeof attempt.value === 'number'
              ? `${formatAnswerValue(attempt.value - attempt.confidence)} – ${formatAnswerValue(
                  attempt.value + attempt.confidence,
                )}`
              : formatAnswerValue(attempt.value)}
          </span>
        </p>
      )}
      <span
        className="rounded-pill px-5 py-2 text-2xl font-black text-white"
        style={{ background: attempt.score >= 550 ? POP.mint : POP.coral }}
      >
        +{attempt.score} pts
      </span>
    </div>
  )
}
