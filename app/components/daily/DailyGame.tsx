'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'

import type { AnswerValue, TQuestion } from '@/app/types'
import { MAX_SCORE, formatAnswerValue } from '@/lib/utils'
import { scoreGuess } from '@/lib/geo/score'
import { dateKeyUTC } from '@/lib/daily'
import { PopShell } from '@/app/components/pop/PopShell'
import { PopLogo } from '@/app/components/pop/PopHeader'
import { PopButton } from '@/app/components/pop/PopButton'
import { POP } from '@/app/components/pop/theme'
import { Question } from '@/app/components/Question'
import { QuestionInput } from '@/app/components/geo/QuestionInput'
import { ChoiceOptions } from '@/app/components/geo/ChoiceOptions'
import { HigherLower } from '@/app/components/geo/HigherLower'
import { RankReveal } from '@/app/components/geo/RankReveal'
import { RouteReveal } from '@/app/components/geo/RouteReveal'
import { WorldMap, mapDistanceKm } from '@/app/components/geo/WorldMap'

const STORE_KEY = 'population-daily'

type Attempt = { value: AnswerValue; score: number }
type SavedPlay = { total: number; buckets: string; streak: number }

function bucket(score: number): string {
  if (score >= 850) return '🟩'
  if (score >= 550) return '🟨'
  if (score > 0) return '🟧'
  return '⬛'
}

export function DailyGame({ questions, dateKey }: { questions: TQuestion[]; dateKey: string }) {
  const maxTotal = questions.length * MAX_SCORE

  const [index, setIndex] = useState(0)
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [revealing, setRevealing] = useState<Attempt | null>(null)
  const [saved, setSaved] = useState<SavedPlay | null>(null)
  const [alreadyPlayed, setAlreadyPlayed] = useState(false)

  // If the player already did today's quiz, jump straight to their result.
  // This reads localStorage *after* mount on purpose: doing it during render
  // (or via a lazy initializer) would diverge from the server HTML and cause a
  // hydration mismatch, so the setState-in-effect here is intentional.
  useEffect(() => {
    try {
      const store = JSON.parse(localStorage.getItem(STORE_KEY) || '{}')
      const play = store.plays?.[dateKey]
      if (play) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe restore from localStorage
        setSaved({ total: play.total, buckets: play.buckets, streak: store.streak ?? 1 })
        setAlreadyPlayed(true)
      }
    } catch {
      /* ignore malformed storage */
    }
  }, [dateKey])

  const finish = (finalAttempts: Attempt[]) => {
    const total = finalAttempts.reduce((s, a) => s + a.score, 0)
    const buckets = finalAttempts.map((a) => bucket(a.score)).join('')
    let streak = 1
    try {
      const store = JSON.parse(localStorage.getItem(STORE_KEY) || '{}')
      const yesterday = dateKeyUTC(new Date(Date.now() - 86_400_000))
      streak = store.lastDate === yesterday ? (store.streak ?? 0) + 1 : 1
      const next = {
        lastDate: dateKey,
        streak,
        plays: { ...(store.plays ?? {}), [dateKey]: { total, buckets } },
      }
      localStorage.setItem(STORE_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
    setSaved({ total, buckets, streak })
  }

  const onAnswer = (
    value: AnswerValue,
    elapsedMs: number,
    extra?: { confidence?: number; cluesUsed?: number },
  ) => {
    const q = questions[index]
    setRevealing({ value, score: scoreGuess(q, value, elapsedMs, extra) })
  }

  const next = () => {
    if (!revealing) return
    const nextAttempts = [...attempts, revealing]
    setAttempts(nextAttempts)
    setRevealing(null)
    if (index + 1 >= questions.length) finish(nextAttempts)
    else setIndex(index + 1)
  }

  if (saved) {
    return <Results saved={saved} maxTotal={maxTotal} dateKey={dateKey} alreadyPlayed={alreadyPlayed} />
  }

  const q = questions[index]

  return (
    <PopShell bg={POP.cobalt}>
      <header className="flex items-center justify-between px-5 pt-5">
        <PopLogo textColor={POP.cobalt} />
        <span
          className="rounded-pill border-2 border-white px-3 py-1.5 text-sm font-black text-pop-ink"
          style={{ background: POP.sunshine }}
        >
          Daily · {index + 1}/{questions.length}
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
            <QuestionInput question={q} onAnswer={onAnswer} />
          </div>
        )}
      </main>
    </PopShell>
  )
}

function Reveal({ question, attempt }: { question: TQuestion; attempt: Attempt }) {
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
      {question.type === 'route' && <RouteReveal question={question} />}
      {question.type === 'slider' && (
        <p className="text-center text-xl font-black text-pop-ink">
          Answer: {formatAnswerValue(question.answer)}
          {question.unit ? ` ${question.unit}` : ''}
          <br />
          <span className="text-pop-ink/60">You: {formatAnswerValue(attempt.value)}</span>
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

function Results({
  saved,
  maxTotal,
  dateKey,
  alreadyPlayed,
}: {
  saved: SavedPlay
  maxTotal: number
  dateKey: string
  alreadyPlayed: boolean
}) {
  const [copied, setCopied] = useState(false)
  const shareText = `Population ${dateKey}\n${saved.buckets}\n${saved.total.toLocaleString()}/${maxTotal.toLocaleString()} pts`

  const share = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <PopShell bg={POP.sunshine}>
      <header className="flex items-center justify-between px-5 pt-5">
        <PopLogo textColor={POP.sunshine} />
      </header>
      <main className="mx-auto flex w-full max-w-md flex-col items-center gap-6 px-5 pb-16 pt-10 text-center">
        <motion.h1
          initial={{ scale: 0, rotate: -6 }}
          animate={{ scale: 1, rotate: -2 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="pop-textshadow-sm text-5xl font-black text-pop-ink"
        >
          {alreadyPlayed ? 'Already played!' : 'Nice one!'}
        </motion.h1>

        <div className="w-full rounded-card bg-white p-7 shadow-pop-card">
          <div className="text-6xl font-black text-pop-ink">
            {saved.total.toLocaleString()}
          </div>
          <div className="text-lg font-bold text-pop-ink/60">of {maxTotal.toLocaleString()} points</div>
          <div className="my-5 text-3xl tracking-widest">{saved.buckets}</div>
          <div
            className="inline-block rounded-pill px-5 py-2 text-lg font-black text-white"
            style={{ background: POP.coral }}
          >
            🔥 {saved.streak}-day streak
          </div>
        </div>

        <PopButton variant="primary" size="lg" className="w-full" onClick={share}>
          {copied ? 'Copied! ✓' : 'Share result'}
        </PopButton>
        <PopButton href="/" variant="secondary" size="lg" className="w-full">
          Home
        </PopButton>
        <p className="text-base font-bold text-pop-ink/60">A fresh set drops every day. Come back tomorrow!</p>
      </main>
    </PopShell>
  )
}
