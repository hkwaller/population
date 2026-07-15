'use client'

import type { AnswerValue, LatLng, TQuestion } from '@/app/types'
import { scoreAnswer } from '@/lib/utils'
import { guessInCountry } from './geometry'

/**
 * Score a guess, resolving map "did they hit the country" against the loaded border
 * geometry. Use this everywhere the app scores an answer - `scoreAnswer` alone can't
 * see the geometry, so calling it directly for map questions loses the borders test.
 */
export function scoreGuess(question: TQuestion, guess: AnswerValue, elapsedMs?: number): number {
  const insideCountry =
    question.type === 'map' && question.ccn3
      ? guessInCountry(question.ccn3, guess as LatLng) === true
      : undefined
  return scoreAnswer(question, guess, elapsedMs, insideCountry)
}
