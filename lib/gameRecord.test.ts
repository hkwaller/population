import { describe, expect, it } from 'vitest'

import { TPlayer } from '@/app/types'
import { buildGameRecord, isClerkUserId } from './gameRecord'
import { makeId, MAX_SCORE } from './utils'

const player = (id: string, scores: number[], extra: Partial<TPlayer> = {}): TPlayer => ({
  id,
  name: id,
  icon: 'Globe',
  color: 'coral',
  score: 0,
  answers: scores.map((score, i) => ({ answer: 0, score, questionId: `q${i}` })),
  ...extra,
})

const build = (players: TPlayer[]) =>
  buildGameRecord({
    gameId: 'zany-alpacas-42',
    players,
    selectedCategories: ['population'],
    amountQuestions: 2,
    showQuestions: true,
    answeredQuestions: [],
    finishedAt: new Date('2026-10-02T12:00:00Z'),
  })

describe('isClerkUserId', () => {
  it('accepts Clerk user ids and rejects guest room slugs', () => {
    expect(isClerkUserId('user_2abcDEF123')).toBe(true)
    expect(isClerkUserId(makeId())).toBe(false)
    expect(isClerkUserId('')).toBe(false)
    expect(isClerkUserId(undefined)).toBe(false)
  })
})

describe('buildGameRecord', () => {
  it('keeps player ids as-is in players[] and winner', () => {
    const { game } = build([player('user_abc', [MAX_SCORE, 500]), player('zany-alpacas-42', [100, 100])])

    expect(game.players.map((p) => p.id)).toEqual(['user_abc', 'zany-alpacas-42'])
    expect(game.winner.id).toBe('user_abc')
  })

  it('totals score, bullseyes and average per player', () => {
    const { game } = build([player('user_abc', [MAX_SCORE, 500])])

    expect(game.players[0]).toMatchObject({ score: 1500, bullseyes: 1, gameAverage: 750 })
  })

  it('only produces stats updates for signed-in players', () => {
    const { statsUpdates } = build([player('user_abc', [10]), player('brave-otters-7', [20])])

    expect(statsUpdates.map((u) => u.id)).toEqual(['user_abc'])
  })

  it('counts multiplayer games and wins for the top scorer', () => {
    const { statsUpdates } = build([player('user_a', [900]), player('user_b', [100, 100])])
    const [a, b] = statsUpdates

    expect(a.increments).toEqual({
      games_played: 1,
      overall_score: 900,
      bullseyes: 0,
      total_questions_answered: 1,
      multiplayer_games: 1,
      wins: 1,
    })
    expect(b.increments).toMatchObject({ multiplayer_games: 1, wins: 0, total_questions_answered: 2 })
  })

  it('does not count a solo game as a multiplayer game or win', () => {
    const { statsUpdates } = build([player('user_a', [MAX_SCORE])])

    expect(statsUpdates[0].increments).toMatchObject({ multiplayer_games: 0, wins: 0, bullseyes: 1 })
  })

  it('seeds a missing preferences row from the in-game sticker', () => {
    const { statsUpdates } = build([player('user_a', [1], { name: 'Ada', color: 'mint', icon: 'Star' })])

    expect(statsUpdates[0].profileSeed).toEqual({
      id: 'user_a',
      display_name: 'Ada',
      preferred_color: 'mint',
      icon: 'Star',
    })
  })
})
