import { readFileSync } from 'node:fs'
import { geoArea, geoNaturalEarth1, geoPath } from 'd3-geo'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const atlas = JSON.parse(readFileSync(new URL('../../public/geo/countries-50m.json', import.meta.url), 'utf8'))

beforeEach(() => {
  vi.resetModules()
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => atlas }))
})
afterEach(() => vi.unstubAllGlobals())

describe('detailed world geometry', () => {
  it('stays within the interactive map geometry budget', async () => {
    const { loadCountryGeometry } = await import('./geometry')
    const { collection } = await loadCountryGeometry()
    const path = geoPath(geoNaturalEarth1().fitSize([800, 411], { type: 'Sphere' }))
    const pathBytes = collection.features.reduce((total, country) => total + (path(country)?.length ?? 0), 0)
    // Bound actual drawing complexity, rather than relying on machine-specific timings.
    expect(pathBytes).toBeLessThan(2_000_000)
  })
  it('keeps island winding from filling the globe or accepting ocean guesses', async () => {
    const { loadCountryGeometry, guessInCountry } = await import('./geometry')
    const { collection } = await loadCountryGeometry()
    expect(collection.features.every((country) => geoArea(country) < 2 * Math.PI)).toBe(true)
    expect(guessInCountry('462', { lat: 0, lng: 0 })).toBe(false)
  })
  it('shares one atlas request between rendering and country-hit scoring', async () => {
    const { loadCountryGeometry, guessInCountry } = await import('./geometry')
    expect(guessInCountry('470', { lat: 35.9, lng: 14.45 })).toBeNull()
    const [first, second] = await Promise.all([loadCountryGeometry(), loadCountryGeometry()])
    expect(first).toBe(second)
    expect(fetch).toHaveBeenCalledExactlyOnceWith('/geo/countries-50m.json')
    expect(first.byCcn3.get('470')).toBeDefined()
    expect(guessInCountry('470', { lat: 35.9, lng: 14.45 })).toBe(true)
  })

  it.each([
    ['Malta', '470', 35.9, 14.45],
    ['Singapore', '702', 1.35, 103.82],
    ['Seychelles', '690', -4.68, 55.49],
    ['French Guiana as part of France', '250', 4, -53],
  ])('retains %s in the rendered and scored geometry', async (_name, code, lat, lng) => {
    const { loadCountryGeometry, guessInCountry } = await import('./geometry')
    await loadCountryGeometry()
    expect(guessInCountry(code, { lat, lng })).toBe(true)
    expect(guessInCountry(code, { lat: 0, lng: 0 })).toBe(false)
  })

  it('allows retry after an unsuccessful atlas response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 503 } as Response)
    const { loadCountryGeometry } = await import('./geometry')
    await expect(loadCountryGeometry()).rejects.toThrow('country geometry: 503')
    await expect(loadCountryGeometry()).resolves.toHaveProperty('collection')
  })
})
