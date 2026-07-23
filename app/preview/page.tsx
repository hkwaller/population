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
import { QuestionResult } from '@/app/components/QuestionResult'
import type { TPlayer } from '@/app/types'
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
  {
    id: 's-higher-lower',
    type: 'higher-lower',
    category: 'higher-lower',
    question: 'Which country is larger by land area?',
    prompt: { kind: 'text', text: 'Which country is larger by land area?' },
    left: { label: 'Kazakhstan', value: 2_724_900, code: '🇰🇿' },
    right: { label: 'Argentina', value: 2_780_400, code: '🇦🇷' },
    metric: 'land area',
    answer: 'right',
  },
  {
    id: 's-odd-one-out',
    type: 'odd-one-out',
    category: 'odd-one-out',
    question: 'Which is the odd one out?',
    prompt: { kind: 'text', text: 'Three of these share something. Which is the odd one out?' },
    options: ['Norway', 'Sweden', 'Denmark', 'Japan'],
    answer: 'Japan',
    sharedProperty: 'are in Europe',
    optionCodes: ['🇳🇴', '🇸🇪', '🇩🇰', '🇯🇵'],
  },
  {
    id: 's-build-up',
    type: 'build-up',
    category: 'build-up',
    question: 'Name the country from the clues',
    prompt: { kind: 'text', text: 'Name the country - guess early for more points!' },
    answer: 'Japan',
    clues: [
      'Home to about 124 million people.',
      'Located in Eastern Asia.',
      'An island nation with no land borders.',
      'Its currency is the Japanese yen.',
      'Its capital is Tokyo.',
    ],
    code: 'JP',
  },
  {
    id: 's-route',
    type: 'route',
    category: 'route',
    question: 'Hop from Portugal to Poland across bordering countries',
    prompt: { kind: 'text', text: 'Chain bordering countries from Portugal to Poland.' },
    from: 'PRT',
    to: 'POL',
    maxSteps: 5,
    optimalSteps: 4,
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

        <h2 className="mt-4 text-center text-2xl font-black text-pop-ink/70">
          Results breakdown (end page)
        </h2>
        <BreakdownDemo />
      </div>
    </div>
  )
}

/**
 * Round-by-round breakdown cards as they render on the end/results page - a map
 * question (guesses + answer on the map) and a rank question (perfect vs partial
 * order), each with mock players so the pills and layout are easy to eyeball.
 */
function BreakdownDemo() {
  const mapQ = SAMPLES.find((q) => q.type === 'map')!
  const rankQ = SAMPLES.find((q) => q.type === 'rank') as RankQuestion
  const hlQ = SAMPLES.find((q) => q.type === 'higher-lower')!
  const oooQ = SAMPLES.find((q) => q.type === 'odd-one-out')!
  const buQ = SAMPLES.find((q) => q.type === 'build-up')!
  const rtQ = SAMPLES.find((q) => q.type === 'route')!

  const mkPlayer = (
    id: string,
    name: string,
    color: string,
    q: TQuestion,
    guess: AnswerValue,
  ): TPlayer => ({
    id,
    name,
    color,
    icon: 'Globe',
    score: scoreGuess(q, guess),
    answers: [{ questionId: q.id, answer: guess, score: scoreGuess(q, guess) }],
  })

  const byScore = (a: TPlayer, b: TPlayer) => b.score - a.score

  const mapPlayers = [
    mkPlayer('m1', 'Ada', 'clay', mapQ, { lat: 1, lng: 38 }), // exact → PERFECT!
    mkPlayer('m2', 'Bo', 'lagoon', mapQ, { lat: 30, lng: 20 }), // off
  ].sort(byScore)

  const rankPlayers = [
    mkPlayer('r1', 'Cy', 'sand', rankQ, ['Nigeria', 'Argentina', 'Portugal', 'Iceland']), // perfect
    mkPlayer('r2', 'Di', 'sage', rankQ, ['Argentina', 'Nigeria', 'Iceland', 'Portugal']), // partial
  ].sort(byScore)

  const hlPlayers = [
    mkPlayer('h1', 'Ev', 'clay', hlQ, 'right'), // correct
    mkPlayer('h2', 'Fi', 'lagoon', hlQ, 'left'), // wrong
  ].sort(byScore)

  const oooPlayers = [
    mkPlayer('o1', 'Gu', 'sand', oooQ, 'Japan'), // correct
    mkPlayer('o2', 'Ha', 'sage', oooQ, 'Norway'), // wrong
  ].sort(byScore)

  const buPlayers = [
    mkPlayer('b1', 'Io', 'clay', buQ, 'Japan'), // correct (full clues via scoreGuess default)
    mkPlayer('b2', 'Jo', 'lagoon', buQ, 'Brazil'), // wrong
  ].sort(byScore)

  const rtPlayers = [
    // Completed route, no wrong hops → full marks.
    mkPlayer('t1', 'Ka', 'clay', rtQ, { path: ['PRT', 'ESP', 'FRA', 'DEU', 'POL'], wrong: [] }),
    // Completed, but attempted two impossible hops along the way → −200.
    mkPlayer('t2', 'La', 'lagoon', rtQ, {
      path: ['PRT', 'ESP', 'FRA', 'DEU', 'POL'],
      wrong: ['ITA', 'MAR'],
    }),
  ].sort(byScore)

  return (
    <>
      <QuestionResult players={mapPlayers} question={mapQ} index={0} />
      <QuestionResult players={rankPlayers} question={rankQ} index={1} />
      <QuestionResult players={hlPlayers} question={hlQ} index={2} />
      <QuestionResult players={oooPlayers} question={oooQ} index={3} />
      <QuestionResult players={buPlayers} question={buQ} index={4} />
      <QuestionResult players={rtPlayers} question={rtQ} index={5} />
    </>
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
        onAnswer={(value, elapsedMs, extra) =>
          setAnswered({ value, score: scoreGuess(question, value, elapsedMs, extra) })
        }
      />
      {answered && (
        <div className="mt-4 rounded-2xl bg-pop-ink px-4 py-3 text-center text-white">
          <span className="font-black">
            You: {formatAnswerValue(answered.value)} · scored {answered.score} · answer{' '}
            {'answer' in question ? formatAnswerValue((question as { answer?: AnswerValue }).answer) : '(see reveal)'}
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
