/**
 * Builds lib/geo/countries.json - the canonical, committed country dataset.
 *
 * Sources:
 * - REST Countries v5 (https://api.restcountries.com/countries/v5) for names,
 *   ISO codes, capital (+coords), area, borders, coordinates, region,
 *   currencies, languages, flag emoji, and sovereignty classification.
 * - Population: World Bank World Development Indicators, SP.POP.TOTL
 *   ("Population, total"), for one pinned reference year (POPULATION_YEAR).
 *   https://data.worldbank.org/indicator/SP.POP.TOTL - CC BY 4.0.
 *   REST Countries' own population field mixes years (and has round
 *   placeholders), which put China above India in generated questions, so it
 *   is only used as a fallback for countries the World Bank doesn't cover
 *   (recorded in `populationFallbacks`).
 * - Outline availability is joined from the world-atlas 110m TopoJSON
 *   (data/raw/countries-110m.json) by numeric ISO code.
 *
 * Output shape: { populationSource, populationYear, populationUpdated,
 * populationFallbacks, countries: Country[] }.
 *
 * Requires RESTCOUNTRIES_API_KEY (see .env.example). Run:
 *   node --env-file=.env.local scripts/build-countries.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { fetchCountryPageviews } from './gen/pageviews.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const KEY = process.env.RESTCOUNTRIES_API_KEY
if (!KEY) {
  console.error(
    'Missing RESTCOUNTRIES_API_KEY. Add it to .env.local and run with --env-file=.env.local',
  )
  process.exit(1)
}

const BASE = 'https://api.restcountries.com/countries/v5'

// Pinned so rebuilds are reproducible. Bump to the latest complete year once the
// World Bank publishes it (WDI usually updates in July).
const POPULATION_YEAR = 2025
const POPULATION_SOURCE = 'World Bank, World Development Indicators (SP.POP.TOTL)'
const WB_URL = `https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&per_page=400&date=${POPULATION_YEAR}`
const RESPONSE_FIELDS = [
  'names.common',
  'names.official',
  'codes.alpha_2',
  'codes.alpha_3',
  'codes.ccn3',
  'capitals',
  'flag.emoji',
  'region',
  'subregion',
  'area',
  'borders',
  'coordinates',
  'currencies',
  'languages',
  'population',
  'classification',
].join(',')

// --- fetch all countries via offset pagination (free plan caps 100/request) ---
async function fetchAll() {
  const all = []
  const PAGE = 100
  for (let offset = 0; ; offset += PAGE) {
    const url = `${BASE}?limit=${PAGE}&offset=${offset}&response_fields=${RESPONSE_FIELDS}`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${KEY}` } })
    if (!res.ok) throw new Error(`v5 request failed (${res.status}) at offset ${offset}`)
    const json = await res.json()
    const batch = json.data?.objects ?? json.data ?? []
    if (batch.length === 0) break
    all.push(...batch)
    if (batch.length < PAGE) break
  }
  return all
}

/** ISO alpha-3 → population for POPULATION_YEAR, plus the dataset's last-updated date. */
async function fetchWorldBankPopulation() {
  const res = await fetch(WB_URL)
  if (!res.ok) throw new Error(`World Bank request failed (${res.status})`)
  const [meta, rows] = await res.json()
  const byIso3 = new Map()
  for (const r of rows ?? []) {
    if (r.countryiso3code && typeof r.value === 'number') byIso3.set(r.countryiso3code, r.value)
  }
  return { byIso3, updated: meta?.lastupdated ?? null }
}

const raw = await fetchAll()
console.log(`fetched ${raw.length} entries from REST Countries v5`)
const wb = await fetchWorldBankPopulation()
console.log(`fetched ${wb.byIso3.size} ${POPULATION_YEAR} populations from the World Bank`)
const populationFallbacks = []

// outline availability from world-atlas (numeric ISO code join)
const atlas = JSON.parse(readFileSync(join(root, 'data/raw/countries-110m.json'), 'utf-8'))
const geomCodes = new Set(atlas.objects.countries.geometries.map((g) => parseInt(String(g.id), 10)))

const pickCapital = (caps) =>
  (Array.isArray(caps) && (caps.find((c) => c.attributes?.primary) ?? caps[0])) || null

// Only for countries the World Bank doesn't publish (e.g. the Holy See).
function restPopulation(c) {
  if (typeof c.population !== 'number') return null
  populationFallbacks.push(c.codes.alpha_3)
  return c.population
}

const countries = raw
  // sovereign UN members + observers (Vatican, Palestine) with a capital = clean quiz set
  .filter((c) => {
    const cls = c.classification ?? {}
    const hasCode = !!c.codes?.alpha_3
    const cap = pickCapital(c.capitals)
    return hasCode && cap?.name && (cls.un_member === true || cls.un_observer === true)
  })
  .map((c) => {
    const cap = pickCapital(c.capitals)
    return {
      cca2: c.codes.alpha_2,
      cca3: c.codes.alpha_3,
      ccn3: c.codes.ccn3, // numeric ISO code - joins to world-atlas geometry id
      name: c.names.common,
      official: c.names.official ?? null,
      capital: cap?.name ?? null,
      capitalLat: cap?.coordinates?.lat ?? null,
      capitalLng: cap?.coordinates?.lng ?? null,
      lat: c.coordinates?.lat ?? null,
      lng: c.coordinates?.lng ?? null,
      area: typeof c.area?.kilometers === 'number' ? c.area.kilometers : null,
      borders: Array.isArray(c.borders) ? c.borders : [],
      region: c.region ?? null,
      subregion: c.subregion ?? null,
      currency: c.currencies?.[0]?.name ?? null,
      currencyCode: c.currencies?.[0]?.code ?? null,
      languages: Array.isArray(c.languages) ? c.languages.map((l) => l.name).filter(Boolean) : [],
      flag: c.flag?.emoji ?? null,
      population: wb.byIso3.get(c.codes.alpha_3) ?? restPopulation(c),
      hasOutline: geomCodes.has(parseInt(String(c.codes.ccn3), 10)),
      pageviews: 0, // filled in below from Wikipedia
    }
  })
  .sort((a, b) => a.name.localeCompare(b.name))

// Wikipedia pageviews - a "fame" proxy consumed by build-questions.mjs for difficulty.
console.log('fetching Wikipedia pageviews…')
const views = await fetchCountryPageviews(countries, (m) => console.log(m))
for (const c of countries) c.pageviews = views.get(c.cca3) ?? 0

mkdirSync(join(root, 'lib/geo'), { recursive: true })
const dataset = {
  populationSource: POPULATION_SOURCE,
  populationYear: POPULATION_YEAR,
  populationUpdated: wb.updated,
  populationFallbacks: populationFallbacks.sort(),
  countries,
}
writeFileSync(join(root, 'lib/geo/countries.json'), JSON.stringify(dataset, null, 0))

const has = (f) => countries.filter(f).length
console.log(`countries: ${countries.length}`)
console.log(
  `  population: ${has((c) => c.population != null)}  area: ${has((c) => c.area != null)}  ` +
    `outline: ${has((c) => c.hasOutline)}  borders: ${has((c) => c.borders.length > 0)}  ` +
    `capitalCoords: ${has((c) => c.capitalLat != null)}`,
)
const noPop = countries.filter((c) => c.population == null).map((c) => c.cca3)
if (noPop.length) console.log(`  no population: ${noPop.join(', ')}`)
if (populationFallbacks.length)
  console.log(`  population from REST Countries (no World Bank data): ${populationFallbacks.join(', ')}`)
