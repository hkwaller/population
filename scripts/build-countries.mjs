/**
 * Builds lib/geo/countries.json — the canonical, committed country dataset.
 *
 * Source: REST Countries v5 (https://api.restcountries.com/countries/v5), the
 * single source of truth for names, ISO codes, capital (+coords), area,
 * borders, coordinates, region, currencies, languages, flag emoji, population,
 * and sovereignty classification. Outline availability is joined from the
 * world-atlas 110m TopoJSON (data/raw/countries-110m.json) by numeric ISO code.
 *
 * Requires RESTCOUNTRIES_API_KEY (see .env.example). Run:
 *   node --env-file=.env.local scripts/build-countries.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const KEY = process.env.RESTCOUNTRIES_API_KEY
if (!KEY) {
  console.error('Missing RESTCOUNTRIES_API_KEY. Add it to .env.local and run with --env-file=.env.local')
  process.exit(1)
}

const BASE = 'https://api.restcountries.com/countries/v5'
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

const raw = await fetchAll()
console.log(`fetched ${raw.length} entries from REST Countries v5`)

// outline availability from world-atlas (numeric ISO code join)
const atlas = JSON.parse(readFileSync(join(root, 'data/raw/countries-110m.json'), 'utf-8'))
const geomCodes = new Set(
  atlas.objects.countries.geometries.map((g) => parseInt(String(g.id), 10)),
)

const pickCapital = (caps) =>
  (Array.isArray(caps) && (caps.find((c) => c.attributes?.primary) ?? caps[0])) || null

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
      ccn3: c.codes.ccn3, // numeric ISO code — joins to world-atlas geometry id
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
      population: typeof c.population === 'number' ? c.population : null,
      hasOutline: geomCodes.has(parseInt(String(c.codes.ccn3), 10)),
    }
  })
  .sort((a, b) => a.name.localeCompare(b.name))

mkdirSync(join(root, 'lib/geo'), { recursive: true })
writeFileSync(join(root, 'lib/geo/countries.json'), JSON.stringify(countries, null, 0))

const has = (f) => countries.filter(f).length
console.log(`countries: ${countries.length}`)
console.log(
  `  population: ${has((c) => c.population != null)}  area: ${has((c) => c.area != null)}  ` +
    `outline: ${has((c) => c.hasOutline)}  borders: ${has((c) => c.borders.length > 0)}  ` +
    `capitalCoords: ${has((c) => c.capitalLat != null)}`,
)
const noPop = countries.filter((c) => c.population == null).map((c) => c.cca3)
if (noPop.length) console.log(`  no population: ${noPop.join(', ')}`)
