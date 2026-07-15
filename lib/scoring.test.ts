import { describe, it, expect } from 'vitest'

import { scoreAnswer, haversineKm, MAX_SCORE, MAP_FALLOFF_KM } from './utils'
import type { ChoiceQuestion, MapQuestion, RankQuestion, SliderQuestion } from '@/app/types'

const slider: SliderQuestion = {
  id: 's',
  type: 'slider',
  category: 'population',
  question: 'pop?',
  answer: 500,
  lower_bound: 0,
  upper_bound: 1000,
}

const choice: ChoiceQuestion = {
  id: 'c',
  type: 'choice',
  category: 'flags',
  question: 'flag?',
  options: ['A', 'B', 'C', 'D'],
  answer: 'B',
}

const map: MapQuestion = {
  id: 'm',
  type: 'map',
  category: 'locate',
  question: 'where?',
  answer: { lat: 0, lng: 0 },
}

describe('scoreAnswer - slider', () => {
  it('exact hit scores max', () => {
    expect(scoreAnswer(slider, 500)).toBe(MAX_SCORE)
  })
  it('scores by proximity, higher = closer', () => {
    const near = scoreAnswer(slider, 550) // 5% off
    const far = scoreAnswer(slider, 900) // 40% off
    expect(near).toBeGreaterThan(far)
    expect(near).toBeLessThan(MAX_SCORE)
  })
  it('never negative even when way off', () => {
    expect(scoreAnswer(slider, 100000)).toBe(0)
  })
})

describe('scoreAnswer - choice', () => {
  it('wrong answer scores 0', () => {
    expect(scoreAnswer(choice, 'A')).toBe(0)
  })
  it('correct + fast beats correct + slow', () => {
    const fast = scoreAnswer(choice, 'B', 500)
    const slow = scoreAnswer(choice, 'B', 14000)
    expect(fast).toBeGreaterThan(slow)
    expect(slow).toBeGreaterThanOrEqual(700) // base
  })
  it('correct with no timing gets full base + bonus', () => {
    expect(scoreAnswer(choice, 'B')).toBe(1000)
  })
})

describe('scoreAnswer - map', () => {
  it('exact location scores max', () => {
    expect(scoreAnswer(map, { lat: 0, lng: 0 })).toBe(MAX_SCORE)
  })
  it('closer guess scores higher', () => {
    const near = scoreAnswer(map, { lat: 1, lng: 1 })
    const far = scoreAnswer(map, { lat: 40, lng: 40 })
    expect(near).toBeGreaterThan(far)
  })
  it('beyond the falloff distance scores 0', () => {
    // antipode is ~20,000 km away, well past MAP_FALLOFF_KM
    expect(scoreAnswer(map, { lat: 0, lng: 179 })).toBe(0)
  })
  it('a guess flagged inside the country scores max even when far from the centroid', () => {
    // insideCountry is decided by the caller (point-in-polygon against real borders).
    const farButInside = scoreAnswer(map, { lat: 30, lng: 30 }, undefined, true)
    expect(farButInside).toBe(MAX_SCORE)
  })
  it('when not inside the country, falls back to distance-based partial credit', () => {
    const outside = scoreAnswer(map, { lat: 5, lng: 5 }, undefined, false)
    expect(outside).toBeGreaterThan(0)
    expect(outside).toBeLessThan(MAX_SCORE)
  })
})

const rank: RankQuestion = {
  id: 'r',
  type: 'rank',
  category: 'ranking',
  question: 'sort by pop',
  order: 'desc',
  items: [
    { label: 'A', value: 300 },
    { label: 'B', value: 200 },
    { label: 'C', value: 100 },
  ],
  answer: ['A', 'B', 'C'], // correct order, largest first
}

describe('scoreAnswer - rank', () => {
  it('exact order scores max', () => {
    expect(scoreAnswer(rank, ['A', 'B', 'C'])).toBe(MAX_SCORE)
  })
  it('fully reversed scores 0', () => {
    expect(scoreAnswer(rank, ['C', 'B', 'A'])).toBe(0)
  })
  it('one swap gives partial credit between 0 and max', () => {
    const oneSwap = scoreAnswer(rank, ['A', 'C', 'B']) // 1 of 3 pairs inverted
    expect(oneSwap).toBeGreaterThan(0)
    expect(oneSwap).toBeLessThan(MAX_SCORE)
  })
  it('closer orderings score higher', () => {
    const closer = scoreAnswer(rank, ['A', 'C', 'B']) // 1 inversion
    const worse = scoreAnswer(rank, ['B', 'C', 'A']) // 2 inversions
    expect(closer).toBeGreaterThan(worse)
  })
})

describe('haversineKm', () => {
  it('is zero for identical points', () => {
    expect(haversineKm({ lat: 10, lng: 20 }, { lat: 10, lng: 20 })).toBe(0)
  })
  it('roughly matches a known distance (London↔Paris ~344 km)', () => {
    const d = haversineKm({ lat: 51.5074, lng: -0.1278 }, { lat: 48.8566, lng: 2.3522 })
    expect(d).toBeGreaterThan(300)
    expect(d).toBeLessThan(400)
  })
  it('falloff constant is a sane positive distance', () => {
    expect(MAP_FALLOFF_KM).toBeGreaterThan(0)
  })
})
