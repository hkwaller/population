import { describe, expect, it } from 'vitest'
import { applyAction, initialRoom, parseAction, type Action, type GameState } from './partyRoom'
import type { TQuestion } from '../app/types'
const config = {
  amountQuestions: 2,
  showQuestions: true,
  confidenceMode: false,
  hostAdFree: false,
  answerModes: {},
  selectedCategories: ['population'],
}
const q = (id: string): TQuestion => ({
  id,
  type: 'slider',
  category: 'population',
  question: 'How many?',
  answer: 10,
  lower_bound: 0,
  upper_bound: 20,
})
const act = (s: GameState, who: string, a: Action) =>
  applyAction(s, who, new Set(['host', 'phone']), a, () => 0)
const join = (id: string, localPlayer = false): Action => ({
  type: 'join',
  player: { id, name: id, localPlayer },
})
const answer = (id: string, questionId = 'q1'): Action => ({
  type: 'answer',
  payload: { id, questionId, answer: 10 },
})
function lobby() {
  let s = act(initialRoom(), 'host', { type: 'setup', config })
  s = act(s, 'host', join('a', true))
  return act(s, 'phone', join('b'))
}
const start = (s = lobby()) =>
  act(s, 'host', { type: 'start', config, questions: [q('q1'), q('q2'), q('q3')] })
describe('room rules', () => {
  it('plays a game, preserves concurrent answers and resets a rematch', () => {
    let s = start()
    s = act(s, 'host', answer('a'))
    s = act(s, 'phone', answer('b'))
    expect(s.players.map((p) => p.answers[0].score)).toEqual([1000, 1000])
    s = act(s, 'host', { type: 'reveal', questionId: 'q1' })
    s = act(s, 'host', { type: 'next', questionId: 'q1' })
    expect(s.currentQuestion?.id).toBe('q2')
    expect(s.answeredQuestions.map((q) => q.id)).toEqual(['q1'])
    s = act(s, 'host', answer('a', 'q2'))
    s = act(s, 'phone', answer('b', 'q2'))
    s = act(s, 'host', { type: 'end', questionId: 'q2' })
    expect(s.players.map((p) => p.score)).toEqual([2000, 2000])
    expect(s.endedAt).toBeTruthy()
    s = act(s, 'host', { type: 'rematch', config, questions: [q('q4')] })
    expect(s.players.every((p) => !p.answers.length && !p.score)).toBe(true)
    expect(s.currentQuestion?.id).toBe('q4')
    expect(s.endedAt).toBeUndefined()
  })
  it('guards controls and seat ownership, one player per device', () => {
    const s = start()
    expect(act(s, 'phone', { type: 'end', questionId: 'q1' })).toBe(s)
    expect(act(s, 'phone', answer('a'))).toBe(s)
    expect(act(s, 'phone', { type: 'boss', id: 'b' })).toBe(s)
    expect(act(s, 'phone', { type: 'setup', config })).toBe(s)
    expect(act(s, 'phone', { type: 'remove', id: 'a' })).toBe(s)
    expect(act(lobby(), 'other', join('a'))).toEqual(lobby())
    const local = lobby()
    expect(act(local, 'host', join('c', true))).toBe(local)
    expect(act(local, 'phone', join('c'))).toBe(local)
  })
  it('ignores retries, duplicate answers and stale round controls', () => {
    const s = act(start(), 'phone', answer('b'))
    expect(act(s, 'phone', answer('b'))).toBe(s)
    expect(act(s, 'phone', answer('b', 'old'))).toBe(s)
    const next = act(s, 'host', { type: 'replace', questionId: 'q1' })
    expect(next.skippedQuestions.map((q) => q.id)).toEqual(['q1'])
    expect(act(next, 'host', { type: 'replace', questionId: 'q1' })).toBe(next)
    expect(act(next, 'host', { type: 'start', config, questions: [q('q9')] })).toBe(next)
    expect(act(next, 'host', { type: 'setup', config })).toBe(next)
  })
  it('accepts a late join, while preventing Clerk identity spoofing', () => {
    const s = start()
    const joined = act(s, 'late-phone', join('late'))
    expect(joined.players).toHaveLength(3)
    expect(joined.owners.late).toBe('late-phone')
    expect(act(s, 'stranger', join('user_someone_else'))).toBe(s)
  })
  it('removes seats without allowing old answers to return', () => {
    const s = act(start(), 'host', { type: 'remove', id: 'b' })
    expect(s.owners.b).toBeUndefined()
    expect(act(s, 'phone', answer('b'))).toBe(s)
  })
  it('ignores per-device confidence unless enabled room-wide', () => {
    const s = act(start(), 'phone', {
      type: 'answer',
      payload: { id: 'b', questionId: 'q1', answer: 10, confidence: 100 },
    })
    expect(s.players[1].answers[0].confidence).toBeUndefined()
    expect(s.players[1].answers[0].score).toBe(1000)
  })
  it('rejects malformed messages and strips injected fields', () => {
    for (const raw of [
      null,
      [],
      { type: 'patch', players: [] },
      { type: 'answer', payload: { id: 'b', questionId: 'q', answer: { lat: NaN, lng: 0 } } },
      { type: 'join', player: { id: '__proto__', name: 'bad' } },
      { type: 'start', config, questions: [{ id: 'x', type: 'map' }] },
    ])
      expect(parseAction(raw)).toBeNull()
    const parsed = parseAction({
      type: 'join',
      player: { id: 'b', name: 'Player', score: 999999, answers: [{}] },
    })
    expect(parsed).not.toHaveProperty('player.score')
    const parsedSetup = parseAction({
      type: 'setup',
      config: { ...config, amountQuestions: 9999, hostId: 'attacker' },
    })
    expect(parsedSetup).toHaveProperty('config.amountQuestions', 20)
    expect(parsedSetup).not.toHaveProperty('config.hostId')
  })
})
