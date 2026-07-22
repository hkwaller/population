'use client'

import type { AnswerValue, LatLng, TQuestion } from '@/app/types'
import { scoreAnswer } from '@/lib/utils'
import { guessInCountry } from './geometry'
import { invalidHopCount } from './adjacency'

/**
 * Score a guess, resolving map "did they hit the country" against the loaded border
 * geometry. Use this everywhere the app scores an answer - `scoreAnswer` alone can't
 * see the geometry, so calling it directly for map questions loses the borders test.
 * `opts.confidence`/`opts.cluesUsed` carry per-answer modifiers from the input layer.
 */
export function scoreGuess(
  question: TQuestion,
  guess: AnswerValue,
  elapsedMs?: number,
  opts?: { confidence?: number; cluesUsed?: number },
): number {
  // In confidence mode the player's band/circle stands in for the country test,
  // so skip point-in-polygon and let scoreMap use the radius instead.
  const insideCountry =
    question.type === 'map' && question.ccn3 && opts?.confidence == null
      ? guessInCountry(question.ccn3, guess as LatLng) === true
      : undefined
  // Route: count broken hops (non-adjacent / revisited) against the graph; scoring
  // docks a fixed penalty per broken hop rather than zeroing the whole route.
  const routeInvalidHops =
    question.type === 'route' ? invalidHopCount(guess as string[]) : undefined
  return scoreAnswer(question, guess, elapsedMs, {
    insideCountry,
    confidence: opts?.confidence,
    cluesUsed: opts?.cluesUsed,
    routeInvalidHops,
  })
}
