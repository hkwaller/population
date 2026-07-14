/**
 * Generates the geography question bank from lib/geo/countries.json.
 * Emits app/database/geo-questions.json (array of TQuestion rows) and
 * regenerates app/database/stats.json (per-category counts).
 *
 * Deterministic: distractors are chosen with a seeded PRNG so re-runs produce
 * identical output (stable ids → idempotent Supabase upserts).
 *
 * Run:  node scripts/gen/build-questions.mjs
 */
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { v5 as uuidv5 } from 'uuid'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const NS = '6ba7b811-9dad-11d1-80b4-00c04fd430c8' // uuid URL namespace
const countries = JSON.parse(readFileSync(join(root, 'lib/geo/countries.json'), 'utf-8'))

const id = (seed) => uuidv5(seed, NS)

// --- seeded PRNG (mulberry32) for reproducible distractor picks ---
function rng(seedStr) {
  let h = 1779033703 ^ seedStr.length
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  let a = h >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function shuffle(arr, rand) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
/** Pick n distractor items, preferring same-region for difficulty. */
function distractors(target, pool, n, keyFn, seed) {
  const rand = rng(seed)
  const same = pool.filter((c) => c.region === target.region && keyFn(c) && keyFn(c) !== keyFn(target))
  const other = pool.filter((c) => c.region !== target.region && keyFn(c) && keyFn(c) !== keyFn(target))
  const ordered = [...shuffle(same, rand), ...shuffle(other, rand)]
  const seen = new Set([keyFn(target)])
  const out = []
  for (const c of ordered) {
    const k = keyFn(c)
    if (!seen.has(k)) {
      seen.add(k)
      out.push(c)
    }
    if (out.length >= n) break
  }
  return out
}
/** Build a 4-option choice question (correct + 3 distractors), options shuffled. */
function choice(category, question, prompt, correctLabel, distractorLabels, seed) {
  const rand = rng(seed + ':opts')
  const options = shuffle([correctLabel, ...distractorLabels], rand)
  return { id: id(seed), type: 'choice', category, question, prompt, options, answer: correctLabel }
}

/** Order-of-magnitude bounds around an answer (log-scaled quantities). */
function magnitudeBounds(answer) {
  if (answer <= 0) return { lower_bound: 0, upper_bound: 100 }
  const oom = Math.floor(Math.log10(answer))
  return { lower_bound: Math.pow(10, oom), upper_bound: Math.pow(10, oom + 1) }
}

const withPop = countries.filter((c) => c.population != null)
const withArea = countries.filter((c) => c.area != null)
const withOutline = countries.filter((c) => c.hasOutline)
const withBorders = countries.filter((c) => c.borders.length > 0)
const withCap = countries.filter((c) => c.capital)
const withCapCoords = countries.filter((c) => c.capitalLat != null && c.capitalLng != null)
const withCurrency = countries.filter((c) => c.currency)
const withLang = countries.filter((c) => c.languages.length > 0)
const withLatLng = countries.filter((c) => c.lat != null && c.lng != null)
const byCca3 = new Map(countries.map((c) => [c.cca3, c]))

const q = []

// 1. flags — flag → country (choice)
for (const c of countries) {
  const d = distractors(c, countries, 3, (x) => x.name, `flag:${c.cca3}`)
  q.push(
    choice(
      'flags',
      `Which country's flag is this?`,
      { kind: 'flag', code: c.cca2 },
      c.name,
      d.map((x) => x.name),
      `flag:${c.cca3}`,
    ),
  )
}

// 2. outline — silhouette → country (choice), only countries with geometry
for (const c of withOutline) {
  const d = distractors(c, withOutline, 3, (x) => x.name, `outline:${c.cca3}`)
  q.push(
    choice(
      'outline',
      `Which country has this shape?`,
      { kind: 'outline', code: c.cca3 },
      c.name,
      d.map((x) => x.name),
      `outline:${c.cca3}`,
    ),
  )
}

// 3. borders — which country borders these neighbours? (choice)
for (const c of withBorders) {
  const neighbourNames = c.borders.map((b) => byCca3.get(b)?.name).filter(Boolean)
  if (neighbourNames.length === 0) continue
  // distractors: countries that do NOT border c and aren't c
  const notNeighbour = countries.filter(
    (x) => x.cca3 !== c.cca3 && !c.borders.includes(x.cca3),
  )
  const d = distractors(c, notNeighbour, 3, (x) => x.name, `borders:${c.cca3}`)
  q.push(
    choice(
      'borders',
      `Which country borders ${neighbourNames.slice(0, 4).join(', ')}?`,
      { kind: 'borders', codes: c.borders },
      c.name,
      d.map((x) => x.name),
      `borders:${c.cca3}`,
    ),
  )
}

// 4. capitals — capital of X (choice)
for (const c of withCap) {
  const d = distractors(c, withCap, 3, (x) => x.capital, `capital:${c.cca3}`)
  q.push(
    choice(
      'capitals',
      `What is the capital of ${c.name}?`,
      { kind: 'text', text: `What is the capital of ${c.name}?` },
      c.capital,
      d.map((x) => x.capital),
      `capital:${c.cca3}`,
    ),
  )
}

// 5. population — slider
for (const c of withPop) {
  const { lower_bound, upper_bound } = magnitudeBounds(c.population)
  q.push({
    id: id(`pop:${c.cca3}`),
    type: 'slider',
    category: 'population',
    question: `What is the population of ${c.name}?`,
    prompt: { kind: 'text', text: `What is the population of ${c.name}?` },
    answer: c.population,
    lower_bound,
    upper_bound,
    unit: 'people',
  })
}

// 6. area — slider (km²)
for (const c of withArea) {
  const { lower_bound, upper_bound } = magnitudeBounds(c.area)
  q.push({
    id: id(`area:${c.cca3}`),
    type: 'slider',
    category: 'area',
    question: `What is the land area of ${c.name}? (km²)`,
    prompt: { kind: 'text', text: `What is the land area of ${c.name}? (km²)` },
    answer: Math.round(c.area),
    lower_bound,
    upper_bound,
    unit: 'km²',
  })
}

// 7. distance — capital-to-capital great-circle distance (slider)
function haversine(a, b) {
  const R = 6371
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat))
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}
{
  const rand = rng('distance-pairs')
  const pool = shuffle(withCapCoords, rand)
  for (let i = 0; i + 1 < pool.length; i += 2) {
    const a = pool[i]
    const b = pool[i + 1]
    const dist = Math.round(haversine({ lat: a.capitalLat, lng: a.capitalLng }, { lat: b.capitalLat, lng: b.capitalLng }))
    q.push({
      id: id(`dist:${a.cca3}:${b.cca3}`),
      type: 'slider',
      category: 'distance',
      question: `How far apart are ${a.capital} and ${b.capital}? (km)`,
      prompt: { kind: 'text', text: `How far apart are ${a.capital} and ${b.capital}? (km)` },
      answer: dist,
      lower_bound: 0,
      upper_bound: 20000,
      unit: 'km',
    })
  }
}

// 8. locate — locate the country on the map (map)
for (const c of withLatLng) {
  q.push({
    id: id(`locate:${c.cca3}`),
    type: 'map',
    category: 'locate',
    question: `Where in the world is ${c.name}?`,
    prompt: { kind: 'text', text: `Tap where ${c.name} is on the map.` },
    answer: { lat: c.lat, lng: c.lng },
    // ccn3 links the guess back to the country's borders for point-in-polygon scoring.
    ...(c.ccn3 != null ? { ccn3: String(c.ccn3) } : {}),
  })
}

// 9. which-bigger — larger population (choice, binary)
{
  const rand = rng('bigger-pairs')
  const pool = shuffle(withPop, rand)
  for (let i = 0; i + 1 < pool.length; i += 2) {
    const a = pool[i]
    const b = pool[i + 1]
    const bigger = a.population >= b.population ? a : b
    q.push({
      id: id(`bigger:${a.cca3}:${b.cca3}`),
      type: 'choice',
      category: 'which-bigger',
      question: `Which has the larger population?`,
      prompt: { kind: 'text', text: `Which has the larger population?` },
      options: shuffle([a.name, b.name], rng(`bigger:${a.cca3}:${b.cca3}:o`)),
      answer: bigger.name,
    })
  }
}

// 10. currency — currency of X (choice)
// Only use GENERIC multi-country currencies (USD, Euro, CFA francs, East
// Caribbean/CFP franc). Currencies named after a country (Swiss franc, Honduran
// lempira) would give the answer away. We also drop the country a currency is
// literally named after (e.g. don't ask "currency of United States?" → "US
// dollar"), so no option ever contains the asked country's own name.
{
  const SAFE_CODES = new Set(['USD', 'EUR', 'XOF', 'XAF', 'XCD', 'XPF'])
  // exclude if any country-name word (4+ chars) appears in the currency name
  const namesItself = (c) =>
    c.name
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((w) => w.length >= 4)
      .some((w) => c.currency.toLowerCase().includes(w))
  const safe = withCurrency.filter((c) => SAFE_CODES.has(c.currencyCode) && !namesItself(c))
  for (const c of safe) {
    const d = distractors(c, safe, 3, (x) => x.currency, `currency:${c.cca3}`)
    if (d.length < 3) continue // not enough distinct safe currencies
    q.push(
      choice(
        'currency',
        `What currency is used in ${c.name}?`,
        { kind: 'text', text: `What currency is used in ${c.name}?` },
        c.currency,
        d.map((x) => x.currency),
        `currency:${c.cca3}`,
      ),
    )
  }
}

// 11. language — primary language of X (choice)
for (const c of withLang) {
  const d = distractors(c, withLang, 3, (x) => x.languages[0], `lang:${c.cca3}`)
  q.push(
    choice(
      'language',
      `Which language is (an) official language of ${c.name}?`,
      { kind: 'text', text: `Which language is spoken in ${c.name}?` },
      c.languages[0],
      d.map((x) => x.languages[0]),
      `lang:${c.cca3}`,
    ),
  )
}

// 12. continent — which region is X in (choice)
{
  const regions = [...new Set(countries.map((c) => c.region).filter(Boolean))]
  for (const c of countries) {
    if (!c.region) continue
    const others = shuffle(regions.filter((r) => r !== c.region), rng(`cont:${c.cca3}`)).slice(0, 3)
    q.push({
      id: id(`cont:${c.cca3}`),
      type: 'choice',
      category: 'continent',
      question: `Which region is ${c.name} in?`,
      prompt: { kind: 'text', text: `Which region is ${c.name} in?` },
      options: shuffle([c.region, ...others], rng(`cont:${c.cca3}:o`)),
      answer: c.region,
    })
  }
}

// --- write outputs ---
writeFileSync(join(root, 'app/database/geo-questions.json'), JSON.stringify(q, null, 0))

const stats = {}
for (const item of q) stats[item.category] = (stats[item.category] ?? 0) + 1
stats.total = q.length
writeFileSync(join(root, 'app/database/stats.json'), JSON.stringify(stats, null, 2))

console.log(`generated ${q.length} questions`)
for (const [k, v] of Object.entries(stats).sort()) console.log(`  ${k}: ${v}`)
