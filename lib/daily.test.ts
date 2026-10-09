import { describe, it, expect } from 'vitest'

import geoQuestions from '@/app/database/geo-questions.json'
import { pickDaily, dateKeyUTC, DAILY_SIZE } from './daily'
import { normalizeQuestionRow } from './utils'
import type { TQuestion } from '@/app/types'

// A small synthetic bank spanning several categories.
const bank: TQuestion[] = Array.from({ length: 120 }, (_, i) => ({
  id: `q${i}`,
  type: 'slider',
  category: ['flags', 'population', 'capitals', 'locate', 'area', 'borders'][i % 6],
  question: `q${i}`,
  answer: i,
  lower_bound: 0,
  upper_bound: 1000,
}))

describe('pickDaily', () => {
  it('returns DAILY_SIZE questions', () => {
    expect(pickDaily(bank, '2026-07-14')).toHaveLength(DAILY_SIZE)
  })

  it('is deterministic for the same date', () => {
    const a = pickDaily(bank, '2026-07-14').map((q) => q.id)
    const b = pickDaily(bank, '2026-07-14').map((q) => q.id)
    expect(a).toEqual(b)
  })

  it('differs across dates', () => {
    const a = pickDaily(bank, '2026-07-14').map((q) => q.id)
    const b = pickDaily(bank, '2026-07-15').map((q) => q.id)
    expect(a).not.toEqual(b)
  })

  it('spreads across categories (no single-category run)', () => {
    const cats = new Set(pickDaily(bank, '2026-07-14').map((q) => q.category))
    expect(cats.size).toBeGreaterThan(1)
  })

  it('never picks the same question twice', () => {
    const ids = pickDaily(bank, '2026-07-14').map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('pickDaily with the JSON bank', () => {
  const geoBank = geoQuestions.map(normalizeQuestionRow)

  it('gives every picked rank question an items array', () => {
    let rankCount = 0
    for (let day = 0; day < 60; day++) {
      const dateKey = dateKeyUTC(new Date(Date.UTC(2026, 9, 1 + day)))
      for (const q of pickDaily(geoBank, dateKey)) {
        if (q.type !== 'rank') continue
        rankCount++
        expect(Array.isArray(q.items), `${dateKey} ${q.id}`).toBe(true)
        expect(q.items.length).toBeGreaterThan(0)
      }
    }
    expect(rankCount).toBeGreaterThan(0)
  })
})

describe('dateKeyUTC', () => {
  it('formats as YYYY-MM-DD', () => {
    expect(dateKeyUTC(new Date('2026-07-14T23:59:00Z'))).toBe('2026-07-14')
  })
})
