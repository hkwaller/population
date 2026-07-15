'use client'

import { feature } from 'topojson-client'
import { geoContains } from 'd3-geo'
import type { Feature, FeatureCollection, Geometry } from 'geojson'

import type { LatLng } from '@/app/types'

export type CountryFeature = Feature<Geometry, { name?: string }>

type Loaded = {
  collection: FeatureCollection<Geometry, { name?: string }>
  byCcn3: Map<string, CountryFeature>
}

let cache: Promise<Loaded> | null = null
// Synchronous handle to the resolved geometry, so scoring can point-in-polygon test
// without awaiting - by answer time the map has already rendered and loaded it.
let loaded: Loaded | null = null

/** Normalise a ccn3 code ("036" / 36) to the map key world-atlas uses ("36"). */
const ccn3Key = (ccn3: string) => String(parseInt(ccn3, 10))

/**
 * Loads the world-atlas 110m country geometry from /geo/countries-110m.json once
 * and memoises it. Features are keyed by numeric ISO code (matches Country.ccn3).
 */
export function loadCountryGeometry() {
  if (!cache) {
    cache = fetch('/geo/countries-110m.json')
      .then((r) => r.json())
      .then((topo: any) => {
        const collection = feature(topo, topo.objects.countries) as unknown as FeatureCollection<
          Geometry,
          { name?: string }
        >
        const byCcn3 = new Map<string, CountryFeature>()
        for (const f of collection.features) {
          if (f.id != null) byCcn3.set(ccn3Key(String(f.id)), f as CountryFeature)
        }
        loaded = { collection, byCcn3 }
        return loaded
      })
      .catch((err) => {
        cache = null // allow retry on transient failure
        throw err
      })
  }
  return cache
}

/**
 * Is `guess` inside the country's real borders? Point-in-polygon against the same
 * 110m geometry we render. Returns null when the geometry isn't loaded yet or the
 * country is too small to appear in the atlas - callers then fall back to distance.
 */
export function guessInCountry(ccn3: string, guess: LatLng): boolean | null {
  if (!loaded) return null
  const f = loaded.byCcn3.get(ccn3Key(ccn3))
  if (!f) return null
  return geoContains(f, [guess.lng, guess.lat])
}
