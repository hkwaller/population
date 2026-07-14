/**
 * Enriches the committed lib/geo/countries.json with a `pageviews` field
 * (English-Wikipedia annual pageviews — a "fame" proxy for difficulty scoring).
 *
 * Unlike scripts/build-countries.mjs this needs NO RESTCountries key — it only
 * patches the existing dataset in place. Idempotent. Run:
 *   node scripts/gen/enrich-countries.mjs
 *
 * (build-countries.mjs also folds this in, so a full rebuild keeps pageviews.)
 */
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { fetchCountryPageviews } from './pageviews.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const file = join(root, 'lib/geo/countries.json')
const countries = JSON.parse(readFileSync(file, 'utf-8'))

console.log(`fetching Wikipedia pageviews for ${countries.length} countries…`)
const views = await fetchCountryPageviews(countries, (m) => console.log(m))

for (const c of countries) c.pageviews = views.get(c.cca3) ?? 0

writeFileSync(file, JSON.stringify(countries, null, 0))

const sorted = [...countries].sort((a, b) => b.pageviews - a.pageviews)
console.log(`\nwrote pageviews to ${countries.length} countries`)
console.log('  most viewed: ', sorted.slice(0, 5).map((c) => `${c.name} ${c.pageviews.toLocaleString()}`).join(', '))
console.log('  least viewed:', sorted.slice(-5).map((c) => `${c.name} ${c.pageviews.toLocaleString()}`).join(', '))
