'use client'

import type { AnswerValue, LatLng, TQuestion } from '@/app/types'
import { scoreAnswer, asRouteAnswer } from '@/lib/utils'
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
  // Route: the path is a real connected chain (the input rejects impossible hops),
  // so score it on whether it actually reached the destination and how many
  // impossible hops were attempted along the way. Validated here against the graph.
  let routeComplete: boolean | undefined
  let routeWrongHops: number | undefined
  if (question.type === 'route') {
    const { path, wrong } = asRouteAnswer(guess)
    routeWrongHops = wrong.length
    routeComplete =
      path.length >= 2 &&
      path[0] === question.from &&
      path[path.length - 1] === question.to &&
      invalidHopCount(path) === 0
  }
  return scoreAnswer(question, guess, elapsedMs, {
    insideCountry,
    confidence: opts?.confidence,
    cluesUsed: opts?.cluesUsed,
    routeComplete,
    routeWrongHops,
  })
}
