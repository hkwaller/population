import { describe, it, expect } from 'vitest'

import { neighbors, areAdjacent, hasBorders, shortestPath, isValidRoute } from './geo/adjacency'

describe('adjacency graph', () => {
  it('knows real land borders (France ↔ Germany)', () => {
    expect(areAdjacent('FRA', 'DEU')).toBe(true)
    expect(areAdjacent('DEU', 'FRA')).toBe(true) // symmetric
  })
  it('rejects non-adjacent pairs (France ↔ Poland)', () => {
    expect(areAdjacent('FRA', 'POL')).toBe(false)
  })
  it('island nations have no land borders', () => {
    // Iceland has no land neighbours in the dataset.
    expect(hasBorders('ISL')).toBe(false)
    expect(neighbors('ISL')).toEqual([])
  })
})

describe('shortestPath', () => {
  it('finds a connected land route (Portugal → Poland)', () => {
    const path = shortestPath('PRT', 'POL')
    expect(path).not.toBeNull()
    expect(path![0]).toBe('PRT')
    expect(path![path!.length - 1]).toBe('POL')
    // every consecutive pair is a real border
    for (let i = 1; i < path!.length; i++) {
      expect(areAdjacent(path![i - 1], path![i])).toBe(true)
    }
  })
  it('returns null for an unreachable island (Portugal → Iceland)', () => {
    expect(shortestPath('PRT', 'ISL')).toBeNull()
  })
})

describe('isValidRoute', () => {
  it('accepts a genuinely adjacent chain', () => {
    expect(isValidRoute('FRA', 'DEU', ['FRA', 'DEU'], 5)).toBe(true)
  })
  it('rejects a broken chain (non-adjacent hop)', () => {
    expect(isValidRoute('FRA', 'POL', ['FRA', 'POL'], 5)).toBe(false)
  })
  it('rejects wrong endpoints', () => {
    expect(isValidRoute('FRA', 'DEU', ['ESP', 'FRA', 'DEU'], 5)).toBe(false)
  })
  it('rejects routes longer than maxSteps', () => {
    const path = shortestPath('PRT', 'POL')!
    expect(isValidRoute('PRT', 'POL', path, 1)).toBe(false)
  })
})
