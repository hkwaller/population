import { describe, it, expect } from 'vitest'

import { sampleQuestions } from './sampleQuestions'
import type { TQuestion } from '@/app/types'

const makeQuestion = (id: string, category: string, tier?: string): TQuestion =>
  ({
    id,
    type: 'slider',
    category,
    tier,
    question: id,
    answer: 0,
    lower_bound: 0,
    upper_bound: 1000,
  }) as TQuestion

// A bank with plenty of headroom over a 10-question round across two categories.
const bank: TQuestion[] = Array.from({ length: 60 }, (_, i) =>
  makeQuestion(`q${i}`, i % 2 === 0 ? 'flags' : 'population'),
)

const base = {
  selectedCategories: ['flags', 'population'],
  selectedDifficulty: 'all' as const,
  amountQuestions: 10,
}

describe('sampleQuestions', () => {
  it('returns questions only from the fetched bank', () => {
    const sampled = sampleQuestions(bank, base)
    const bankIds = new Set(bank.map((q) => q.id))
    expect(sampled.length).toBeGreaterThan(0)
    expect(sampled.every((q) => bankIds.has(q.id))).toBe(true)
  })

  it('mixes the selected categories rather than clustering', () => {
    const sampled = sampleQuestions(bank, base)
    const categories = new Set(sampled.map((q) => q.category))
    expect(categories.has('flags')).toBe(true)
    expect(categories.has('population')).toBe(true)
  })

  it('excludes the previous round when the bank has enough to spare', () => {
    const previous = bank.slice(0, 20)
    const excludeIds = new Set(previous.map((q) => q.id))
    const sampled = sampleQuestions(bank, { ...base, excludeIds })
    expect(sampled.every((q) => !excludeIds.has(q.id))).toBe(true)
  })

  it('ignores the exclusion when it would starve the round', () => {
    // Exclude all but 3 - fewer than amountQuestions - so it must fall back.
    const excludeIds = new Set(bank.slice(3).map((q) => q.id))
    const sampled = sampleQuestions(bank, { ...base, excludeIds })
    expect(sampled.length).toBeGreaterThanOrEqual(base.amountQuestions)
  })

  it('returns an empty array when nothing was fetched', () => {
    expect(sampleQuestions([], base)).toEqual([])
  })
})
