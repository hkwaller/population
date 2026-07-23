import { describe, it, expect } from 'vitest'

import { scoreGuess } from './geo/score'
import { MAX_SCORE, ROUTE_HOP_PENALTY } from './utils'
import type { RouteQuestion } from '@/app/types'

// End-to-end: scoreGuess resolves route completeness + wrong hops against the real
// adjacency graph (Portugal → Poland), the way the app scores a locked-in route.
const route: RouteQuestion = {
  id: 'rt',
  type: 'route',
  category: 'route',
  question: 'hop',
  from: 'PRT',
  to: 'POL',
  maxSteps: 6,
  optimalSteps: 4,
}

describe('scoreGuess - route (end to end)', () => {
  it('a completed, fully connected path with no wrong hops scores max', () => {
    const guess = { path: ['PRT', 'ESP', 'FRA', 'DEU', 'POL'], wrong: [] }
    expect(scoreGuess(route, guess)).toBe(MAX_SCORE)
  })
  it('docks ROUTE_HOP_PENALTY for each attempted wrong hop', () => {
    const guess = { path: ['PRT', 'ESP', 'FRA', 'DEU', 'POL'], wrong: ['ITA', 'MAR'] }
    expect(scoreGuess(route, guess)).toBe(MAX_SCORE - 2 * ROUTE_HOP_PENALTY)
  })
  it('a path that never reaches the destination scores 0', () => {
    const guess = { path: ['PRT', 'ESP'], wrong: [] }
    expect(scoreGuess(route, guess)).toBe(0)
  })
  it('a path with a fabricated (non-adjacent) hop is not complete → 0', () => {
    // ESP→POL is not a real border, so the chain isn't valid end-to-end.
    const guess = { path: ['PRT', 'ESP', 'POL'], wrong: [] }
    expect(scoreGuess(route, guess)).toBe(0)
  })
})
