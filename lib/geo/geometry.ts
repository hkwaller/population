'use client'

import { feature } from 'topojson-client'
import type { Feature, FeatureCollection, Geometry } from 'geojson'

export type CountryFeature = Feature<Geometry, { name?: string }>

let cache: Promise<{
  collection: FeatureCollection<Geometry, { name?: string }>
  byCcn3: Map<string, CountryFeature>
}> | null = null

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
          if (f.id != null) byCcn3.set(String(parseInt(String(f.id), 10)), f as CountryFeature)
        }
        return { collection, byCcn3 }
      })
      .catch((err) => {
        cache = null // allow retry on transient failure
        throw err
      })
  }
  return cache
}
