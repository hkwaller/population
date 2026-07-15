'use client'

// Dev-only visual harness for the geography question components. Not linked in
// the app nav; visit /preview to sanity-check prompts, inputs, and reveals.

import { useState } from 'react'

import type { AnswerValue, RankQuestion, TQuestion } from '@/app/types'
import { QuestionPrompt } from '@/app/components/geo/QuestionPrompt'
import { QuestionInput } from '@/app/components/geo/QuestionInput'
import { ChoiceOptions } from '@/app/components/geo/ChoiceOptions'
import { WorldMap, mapDistanceKm } from '@/app/components/geo/WorldMap'
import { RankReveal } from '@/app/components/geo/RankReveal'
import { RankAnswerFlags } from '@/app/components/geo/RankFlags'
import { formatAnswerValue } from '@/lib/utils'
import { scoreGuess } from '@/lib/geo/score'
import { POP } from '@/app/components/pop/theme'

const SAMPLES: TQuestion[] = [
  {
    id: 's-flag',
    type: 'choice',
    category: 'flags',
    question: "Which country's flag is this?",
    prompt: { kind: 'flag', code: 'JP' },
    options: ['Japan', 'Bangladesh', 'Palau', 'South Korea'],
    answer: 'Japan',
  },
  {
    id: 's-rank',
    type: 'rank',
    category: 'ranking',
    question: 'Sort these by population - largest first',
    prompt: { kind: 'text', text: 'Sort these by population - largest first' },
    order: 'desc',
    unit: 'people',
    items: [
      { label: 'Nigeria', value: 223_000_000 },
      { label: 'Argentina', value: 45_000_000 },
      { label: 'Portugal', value: 10_300_000 },
      { label: 'Iceland', value: 375_000 },
    ],
    answer: ['Nigeria', 'Argentina', 'Portugal', 'Iceland'],
  },
  {
    id: 's-outline',
    type: 'choice',
    category: 'outline',
    question: 'Which country has this shape?',
    prompt: { kind: 'outline', code: 'ITA' },
    options: ['Italy', 'Greece', 'Croatia', 'Spain'],
    answer: 'Italy',
  },
  {
    id: 's-borders',
    type: 'choice',
    category: 'borders',
    question: 'Which country borders France, Austria, Slovenia?',
    prompt: { kind: 'borders', codes: ['FRA', 'AUT', 'SVN', 'CHE'] },
    options: ['Italy', 'Portugal', 'Poland', 'Norway'],
    answer: 'Italy',
  },
  {
    id: 's-capital',
    type: 'choice',
    category: 'capitals',
    question: 'What is the capital of Canada?',
    prompt: { kind: 'text', text: 'What is the capital of Canada?' },
    options: ['Toronto', 'Ottawa', 'Vancouver', 'Montreal'],
    answer: 'Ottawa',
  },
  {
    id: 's-pop',
    type: 'slider',
    category: 'population',
    question: 'What is the population of Brazil?',
    prompt: { kind: 'text', text: 'What is the population of Brazil?' },
    answer: 211_000_000,
    lower_bound: 100_000_000,
    upper_bound: 1_000_000_000,
    unit: 'people',
  },
  {
    id: 's-map',
    type: 'map',
    category: 'locate',
    question: 'Where in the world is Kenya?',
    prompt: { kind: 'text', text: 'Tap where Kenya is on the map.' },
    answer: { lat: 1, lng: 38 },
  },
]

export default function PreviewPage() {
  return (
    <div style={{ background: POP.paper, minHeight: '100vh' }} className="px-5 py-10">
      <h1 className="mb-8 text-center text-4xl font-black text-pop-ink">Question preview</h1>
      <div className="mx-auto flex max-w-2xl flex-col gap-14">
        {SAMPLES.map((q) => (
          <PreviewCard key={q.id} question={q} />
        ))}
        <RevealDemo />
      </div>
    </div>
  )
}

function PreviewCard({ question }: { question: TQuestion }) {
  const [answered, setAnswered] = useState<{ value: AnswerValue; score: number } | null>(null)
  return (
    <section className="rounded-[32px] bg-white p-6 shadow-pop-card">
      <div className="mb-2 text-xs font-black uppercase tracking-wide text-pop-ink/40">
        {question.type} · {question.category}
      </div>
      <div className="mb-6 flex flex-col items-center gap-4">
        <QuestionPrompt prompt={question.prompt} fallbackText={question.question} />
      </div>
      <QuestionInput
        question={question}
        disabled={!!answered}
        onAnswer={(value, elapsedMs) =>
          setAnswered({ value, score: scoreGuess(question, value, elapsedMs) })
        }
      />
      {answered && (
        <div className="mt-4 rounded-2xl bg-pop-ink px-4 py-3 text-center text-white">
          <span className="font-black">
            You: {formatAnswerValue(answered.value)} · scored {answered.score} · answer{' '}
            {formatAnswerValue(question.answer)}
          </span>
        </div>
      )}
    </section>
  )
}

// Reveal states: choice highlight + map distance line
function RevealDemo() {
  const guess = { lat: 20, lng: 10 }
  const answer = { lat: 1, lng: 38 }
  return (
    <section className="rounded-[32px] bg-white p-6 shadow-pop-card">
      <div className="mb-4 text-xs font-black uppercase tracking-wide text-pop-ink/40">
        reveal states
      </div>
      <ChoiceOptions
        options={['Italy', 'Greece', 'Croatia', 'Spain']}
        selected="Greece"
        correct="Italy"
      />
      <div className="mt-6 overflow-hidden rounded-[24px] border-4 border-pop-ink">
        <WorldMap value={guess} answer={answer} interactive={false} />
      </div>
      <p className="mt-2 text-center font-bold text-pop-ink/60">
        distance: {mapDistanceKm(guess, answer)} km
      </p>
      <div className="mt-8">
        <RankReveal
          question={SAMPLES.find((q) => q.id === 's-rank') as RankQuestion}
          guess={['Nigeria', 'Portugal', 'Argentina', 'Iceland']}
        />
      </div>
      <div className="mt-8" data-testid="rank-answer-flags">
        <RankAnswerFlags answer={['Nigeria', 'Argentina', 'Portugal', 'Iceland']} />
      </div>
    </section>
  )
}
