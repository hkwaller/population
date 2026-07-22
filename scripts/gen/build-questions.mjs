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
  const same = pool.filter(
    (c) => c.region === target.region && keyFn(c) && keyFn(c) !== keyFn(target),
  )
  const other = pool.filter(
    (c) => c.region !== target.region && keyFn(c) && keyFn(c) !== keyFn(target),
  )
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

// --- fame → difficulty ---------------------------------------------------
// Wikipedia pageviews are heavily skewed (India 47M vs Timor-Leste 320k), so we
// log-scale them into a 0..1 "fame" score. Obscurity (1 - fame) drives per-question
// difficulty: it's much harder to name Vanuatu's flag/capital/currency than the US's.
const pvs = countries.map((c) => c.pageviews).filter((v) => v > 0)
const logMin = Math.log(Math.min(...pvs))
const logMax = Math.log(Math.max(...pvs))
const fame = (c) =>
  !c.pageviews || c.pageviews <= 0 ? 0 : (Math.log(c.pageviews) - logMin) / (logMax - logMin)
const obscurity = (c) => 1 - fame(c)

const q = []
/** Push a question tagged with a 0..1 difficulty (a `tier` is assigned later). */
const push = (question, difficulty) =>
  q.push({
    ...question,
    difficulty: Math.round(Math.max(0, Math.min(1, difficulty)) * 1000) / 1000,
  })

/**
 * Deterministically build up to `partnersPer` distinct partners per country,
 * de-duplicating unordered pairs. Lets distance/which-bigger use every country
 * several times instead of pairing them off once and discarding half.
 */
function makePairs(pool, partnersPer, seedBase) {
  const seen = new Set()
  const pairs = []
  for (const a of pool) {
    const others = shuffle(
      pool.filter((x) => x.cca3 !== a.cca3),
      rng(`${seedBase}:${a.cca3}`),
    )
    let added = 0
    for (const b of others) {
      if (added >= partnersPer) break
      const key = [a.cca3, b.cca3].sort().join('-')
      if (seen.has(key)) continue
      seen.add(key)
      pairs.push([a, b])
      added++
    }
  }
  return pairs
}

// 1. flags - flag → country (choice)
for (const c of countries) {
  const d = distractors(c, countries, 3, (x) => x.name, `flag:${c.cca3}`)
  push(
    choice(
      'flags',
      `Which country's flag is this?`,
      { kind: 'flag', code: c.cca2 },
      c.name,
      d.map((x) => x.name),
      `flag:${c.cca3}`,
    ),
    obscurity(c),
  )
}

// 2. outline - silhouette → country (choice), only countries with geometry
for (const c of withOutline) {
  const d = distractors(c, withOutline, 3, (x) => x.name, `outline:${c.cca3}`)
  push(
    choice(
      'outline',
      `Which country has this shape?`,
      { kind: 'outline', code: c.cca3 },
      c.name,
      d.map((x) => x.name),
      `outline:${c.cca3}`,
    ),
    obscurity(c),
  )
}

// 3. borders - which country borders these neighbours? (choice)
for (const c of withBorders) {
  const neighbourNames = c.borders.map((b) => byCca3.get(b)?.name).filter(Boolean)
  if (neighbourNames.length === 0) continue
  // distractors: countries that do NOT border c and aren't c
  const notNeighbour = countries.filter((x) => x.cca3 !== c.cca3 && !c.borders.includes(x.cca3))
  const d = distractors(c, notNeighbour, 3, (x) => x.name, `borders:${c.cca3}`)
  push(
    choice(
      'borders',
      `Which country borders ${neighbourNames.slice(0, 4).join(', ')}?`,
      { kind: 'borders', codes: c.borders },
      c.name,
      d.map((x) => x.name),
      `borders:${c.cca3}`,
    ),
    obscurity(c),
  )
}

// 4. capitals - capital of X (choice), plus the reverse (capital → country)
for (const c of withCap) {
  const d = distractors(c, withCap, 3, (x) => x.capital, `capital:${c.cca3}`)
  push(
    choice(
      'capitals',
      `What is the capital of ${c.name}?`,
      { kind: 'text', text: `What is the capital of ${c.name}?` },
      c.capital,
      d.map((x) => x.capital),
      `capital:${c.cca3}`,
    ),
    obscurity(c),
  )
  // reverse: name the country from its capital - doubles the category
  const dr = distractors(c, withCap, 3, (x) => x.name, `caprev:${c.cca3}`)
  push(
    choice(
      'capitals',
      `Which country's capital is ${c.capital}?`,
      { kind: 'text', text: `Which country's capital is ${c.capital}?` },
      c.name,
      dr.map((x) => x.name),
      `caprev:${c.cca3}`,
    ),
    obscurity(c),
  )
}

// 5. population - slider
for (const c of withPop) {
  const { lower_bound, upper_bound } = magnitudeBounds(c.population)
  push(
    {
      id: id(`pop:${c.cca3}`),
      type: 'slider',
      category: 'population',
      question: `What is the population of ${c.name}?`,
      prompt: { kind: 'text', text: `What is the population of ${c.name}?` },
      answer: c.population,
      lower_bound,
      upper_bound,
      unit: 'people',
    },
    obscurity(c),
  )
}

// 6. area - slider (km²)
for (const c of withArea) {
  const { lower_bound, upper_bound } = magnitudeBounds(c.area)
  push(
    {
      id: id(`area:${c.cca3}`),
      type: 'slider',
      category: 'area',
      question: `What is the land area of ${c.name}? (km²)`,
      prompt: { kind: 'text', text: `What is the land area of ${c.name}? (km²)` },
      answer: Math.round(c.area),
      lower_bound,
      upper_bound,
      unit: 'km²',
    },
    obscurity(c),
  )
}

// 7. distance - capital-to-capital great-circle distance (slider)
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
// Only pair *well-known* capitals. Pairing every capital with arbitrary partners
// produced meaningless questions (e.g. Palikir↔Ngerulmud) that players can't place.
// Restrict the pool to countries above a fame threshold so both endpoints are
// recognizable; obscurity still varies the difficulty within that pool.
const DISTANCE_FAME_MIN = 0.5
const wellKnownCaps = withCapCoords.filter((c) => fame(c) >= DISTANCE_FAME_MIN)
// Each capital pairs with 3 partners (deduped) since the pool is now curated.
for (const [a, b] of makePairs(wellKnownCaps, 3, 'distance-pairs')) {
  const dist = Math.round(
    haversine({ lat: a.capitalLat, lng: a.capitalLng }, { lat: b.capitalLat, lng: b.capitalLng }),
  )
  push(
    {
      id: id(`dist:${a.cca3}:${b.cca3}`),
      type: 'slider',
      category: 'distance',
      question: `How far apart are ${a.capital} and ${b.capital}? (km)`,
      prompt: { kind: 'text', text: `How far apart are ${a.capital} and ${b.capital}? (km)` },
      answer: dist,
      lower_bound: 0,
      upper_bound: 20000,
      unit: 'km',
    },
    (obscurity(a) + obscurity(b)) / 2,
  )
}

// 8. locate - locate the country on the map (map)
for (const c of withLatLng) {
  push(
    {
      id: id(`locate:${c.cca3}`),
      type: 'map',
      category: 'locate',
      question: `Where in the world is ${c.name}?`,
      prompt: { kind: 'text', text: `Tap where ${c.name} is on the map.` },
      answer: { lat: c.lat, lng: c.lng },
      // ccn3 links the guess back to the country's borders for point-in-polygon scoring.
      ...(c.ccn3 != null ? { ccn3: String(c.ccn3) } : {}),
    },
    obscurity(c),
  )
}

// 9. which-bigger - larger population (choice, binary)
// Difficulty blends how CLOSE the two populations are (a near-tie is hard) with
// how obscure the pair is. China vs Tuvalu is easy; China vs India is hard.
for (const [a, b] of makePairs(withPop, 2, 'bigger-pairs')) {
  const bigger = a.population >= b.population ? a : b
  const closeness = Math.min(a.population, b.population) / Math.max(a.population, b.population, 1)
  push(
    {
      id: id(`bigger:${a.cca3}:${b.cca3}`),
      type: 'choice',
      category: 'which-bigger',
      question: `Which has the larger population?`,
      prompt: { kind: 'text', text: `Which has the larger population?` },
      options: shuffle([a.name, b.name], rng(`bigger:${a.cca3}:${b.cca3}:o`)),
      answer: bigger.name,
    },
    0.6 * closeness + 0.4 * ((obscurity(a) + obscurity(b)) / 2),
  )
}

// 10. currency - currency of X (choice)
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
    push(
      choice(
        'currency',
        `What currency is used in ${c.name}?`,
        { kind: 'text', text: `What currency is used in ${c.name}?` },
        c.currency,
        d.map((x) => x.currency),
        `currency:${c.cca3}`,
      ),
      obscurity(c),
    )
  }
}

// 11. language - primary language of X (choice)
for (const c of withLang) {
  const d = distractors(c, withLang, 3, (x) => x.languages[0], `lang:${c.cca3}`)
  push(
    choice(
      'language',
      `Which language is (an) official language of ${c.name}?`,
      { kind: 'text', text: `Which language is spoken in ${c.name}?` },
      c.languages[0],
      d.map((x) => x.languages[0]),
      `lang:${c.cca3}`,
    ),
    obscurity(c),
  )
}

// 12. continent - which region is X in (choice)
{
  const regions = [...new Set(countries.map((c) => c.region).filter(Boolean))]
  for (const c of countries) {
    if (!c.region) continue
    const others = shuffle(
      regions.filter((r) => r !== c.region),
      rng(`cont:${c.cca3}`),
    ).slice(0, 3)
    push(
      {
        id: id(`cont:${c.cca3}`),
        type: 'choice',
        category: 'continent',
        question: `Which region is ${c.name} in?`,
        prompt: { kind: 'text', text: `Which region is ${c.name} in?` },
        options: shuffle([c.region, ...others], rng(`cont:${c.cca3}:o`)),
        answer: c.region,
      },
      obscurity(c),
    )
  }
}

// 13. ranking - put N countries in order by population (rank / reorder).
// Item count IS the difficulty lever: easy=3, medium=4, hard=5. Tier is set
// explicitly here (the threshold pass below leaves already-tiered questions alone).
{
  const byFame = [...withPop].sort((a, b) => fame(b) - fame(a))
  const famousPool = byFame.slice(0, 70) // most-recognised third-ish
  const obscurePool = byFame.slice(55) // lean toward the less-famous for hard
  const seen = new Set()

  // `order` = 'desc' ("largest first") or 'asc' ("smallest first"). Stored in
  // `extra.order` so it round-trips through Supabase (see normalizeQuestionRow).
  const genTier = (tier, count, pool, n, difficulty, requireSpread, order) => {
    const asc = order === 'asc'
    const label = asc ? `Sort these by population - smallest first` : `Sort these by population - largest first`
    let made = 0
    for (let attempt = 0; made < count && attempt < count * 50; attempt++) {
      const pick = shuffle(pool, rng(`rank:${order}:${tier}:${attempt}`)).slice(0, n)
      if (pick.length < n) break
      const key = pick
        .map((c) => c.cca3)
        .sort()
        .join('-')
      const seenKey = `${order}:${key}`
      if (seen.has(seenKey)) continue
      const sorted = [...pick].sort((a, b) =>
        asc ? a.population - b.population : b.population - a.population,
      )
      // reject exact ties (ambiguous) and, for easy, near-ties (too subtle)
      let ok = true
      for (let i = 1; i < sorted.length; i++) {
        const hi = Math.max(sorted[i - 1].population, sorted[i].population)
        const lo = Math.min(sorted[i - 1].population, sorted[i].population)
        const ratio = hi / lo
        if (ratio === 1 || (requireSpread && ratio < 1.3)) {
          ok = false
          break
        }
      }
      if (!ok) continue
      seen.add(seenKey)
      push(
        {
          id: id(`rank:${order}:${tier}:${key}`),
          type: 'rank',
          category: 'ranking',
          question: label,
          prompt: { kind: 'text', text: label },
          // items live in `options` (array of {label,value}); shuffled presentation order
          options: shuffle(pick, rng(`rank:${order}:${tier}:${attempt}:o`)).map((c) => ({
            label: c.name,
            value: c.population,
          })),
          answer: sorted.map((c) => c.name),
          order,
          unit: 'people',
          tier,
          extra: { order },
        },
        difficulty,
      )
      made++
    }
  }
  genTier('easy', 100, famousPool, 3, 0.2, true, 'desc')
  genTier('medium', 100, withPop, 4, 0.5, false, 'desc')
  genTier('hard', 100, obscurePool, 5, 0.8, false, 'desc')
  // Fewer "smallest first" variants for variety without doubling the bank.
  genTier('easy', 50, famousPool, 3, 0.2, true, 'asc')
  genTier('medium', 50, withPop, 4, 0.5, false, 'asc')
  genTier('hard', 50, obscurePool, 5, 0.8, false, 'asc')
}

// 14. higher-lower - which country is larger by land area? (binary, own UI)
// Uses AREA (which-bigger already covers population), so the two categories test
// different knowledge instead of duplicating each other.
for (const [a, b] of makePairs(withArea, 2, 'hl-area-pairs')) {
  const answer = a.area >= b.area ? 'left' : 'right'
  const closeness = Math.min(a.area, b.area) / Math.max(a.area, b.area, 1)
  const left = { label: a.name, value: Math.round(a.area), code: a.flag ?? undefined }
  const right = { label: b.name, value: Math.round(b.area), code: b.flag ?? undefined }
  const metric = 'land area'
  push(
    {
      id: id(`hl-area:${a.cca3}:${b.cca3}`),
      type: 'higher-lower',
      category: 'higher-lower',
      question: `Which country is larger by land area?`,
      prompt: { kind: 'text', text: `Which country is larger by land area?` },
      answer,
      left,
      right,
      metric,
      extra: { left, right, metric },
    },
    0.6 * closeness + 0.4 * ((obscurity(a) + obscurity(b)) / 2),
  )
}

// 15. odd-one-out - three countries share a property, one doesn't (choice-like).
// A generator over country attributes: region, hemisphere, currency, language,
// and "island / no land borders". The property is surfaced verbatim on reveal.
{
  const oooDifficulty = (odd, three) =>
    (obscurity(odd) + three.reduce((s, c) => s + obscurity(c), 0) / three.length) / 2

  const oddQuestion = (seed, three, odd, sharedProperty) => {
    const four = shuffle([...three, odd], rng(`${seed}:o`))
    const optionCodes = four.map((c) => c.flag ?? null)
    return {
      id: id(seed),
      type: 'odd-one-out',
      category: 'odd-one-out',
      question: `Which is the odd one out?`,
      prompt: {
        kind: 'text',
        text: `Three of these share something. Which is the odd one out?`,
      },
      options: four.map((c) => c.name),
      answer: odd.name,
      sharedProperty,
      optionCodes,
      extra: { sharedProperty, optionCodes },
    }
  }

  const byRegion = {}
  for (const c of countries) if (c.region) (byRegion[c.region] ??= []).push(c)
  const regions = Object.keys(byRegion)

  // a) region
  {
    let made = 0
    for (const odd of shuffle(
      countries.filter((c) => c.region),
      rng('ooo-region'),
    )) {
      if (made >= 120) break
      const otherRegions = regions.filter((r) => r !== odd.region && byRegion[r].length >= 3)
      if (!otherRegions.length) continue
      const R = shuffle(otherRegions, rng(`ooo-region:${odd.cca3}`))[0]
      const three = shuffle(byRegion[R], rng(`ooo-region:${odd.cca3}:pick`)).slice(0, 3)
      if (three.length < 3) continue
      push(oddQuestion(`ooo-region:${odd.cca3}`, three, odd, `are in ${R}`), oooDifficulty(odd, three))
      made++
    }
  }

  // b) hemisphere (sign of centroid latitude)
  {
    const north = withLatLng.filter((c) => c.lat >= 0)
    const south = withLatLng.filter((c) => c.lat < 0)
    let made = 0
    for (const odd of shuffle(withLatLng, rng('ooo-hemi'))) {
      if (made >= 80) break
      const oddNorth = odd.lat >= 0
      const pool = oddNorth ? south : north
      const hemiName = oddNorth ? 'Southern Hemisphere' : 'Northern Hemisphere'
      const three = shuffle(pool, rng(`ooo-hemi:${odd.cca3}`)).slice(0, 3)
      if (three.length < 3) continue
      push(
        oddQuestion(`ooo-hemi:${odd.cca3}`, three, odd, `are in the ${hemiName}`),
        oooDifficulty(odd, three),
      )
      made++
    }
  }

  // c) shared currency
  {
    const byCurr = {}
    for (const c of withCurrency) (byCurr[c.currencyCode] ??= []).push(c)
    for (const [code, arr] of Object.entries(byCurr)) {
      if (arr.length < 3) continue
      const three = shuffle(arr, rng(`ooo-curr:${code}`)).slice(0, 3)
      const odd = shuffle(
        withCurrency.filter((c) => c.currencyCode !== code),
        rng(`ooo-curr:${code}:odd`),
      )[0]
      if (three.length < 3 || !odd) continue
      push(
        oddQuestion(`ooo-curr:${code}`, three, odd, `use the ${three[0].currency}`),
        oooDifficulty(odd, three),
      )
    }
  }

  // d) shared primary language
  {
    const byLang = {}
    for (const c of withLang) (byLang[c.languages[0]] ??= []).push(c)
    for (const [lang, arr] of Object.entries(byLang)) {
      if (arr.length < 3) continue
      const three = shuffle(arr, rng(`ooo-lang:${lang}`)).slice(0, 3)
      const odd = shuffle(
        withLang.filter((c) => c.languages[0] !== lang),
        rng(`ooo-lang:${lang}:odd`),
      )[0]
      if (three.length < 3 || !odd) continue
      push(
        oddQuestion(`ooo-lang:${lang}`, three, odd, `have ${lang} as an official language`),
        oooDifficulty(odd, three),
      )
    }
  }

  // e) island / no land borders
  {
    const islands = countries.filter((c) => c.borders.length === 0)
    const mainland = countries.filter((c) => c.borders.length > 0)
    let made = 0
    for (const odd of shuffle(mainland, rng('ooo-island'))) {
      if (made >= 60) break
      const three = shuffle(islands, rng(`ooo-island:${odd.cca3}`)).slice(0, 3)
      if (three.length < 3) continue
      push(
        oddQuestion(`ooo-island:${odd.cca3}`, three, odd, `are island nations with no land borders`),
        oooDifficulty(odd, three),
      )
      made++
    }
  }
}

// 16. build-up - progressive clue reveal; name the country (typeahead answer).
// Restricted to reasonably famous countries so it's fair to name them; clues run
// hardest (vague population) → easiest (capital gives it away).
{
  const BUILD_FAME_MIN = 0.45
  const pool = countries.filter(
    (c) => c.capital && c.population != null && c.region && fame(c) >= BUILD_FAME_MIN,
  )
  for (const c of pool) {
    const clues = []
    const popPhrase =
      c.population >= 1_000_000
        ? `about ${Math.round(c.population / 1_000_000)} million people`
        : `${c.population.toLocaleString('en-US')} people`
    clues.push(`Home to ${popPhrase}.`)
    clues.push(`Located in ${c.subregion || c.region}.`)
    if (c.borders.length > 0) {
      const nb = c.borders
        .map((b) => byCca3.get(b)?.name)
        .filter(Boolean)
        .slice(0, 3)
      clues.push(
        nb.length
          ? `Borders ${nb.join(', ')}.`
          : `Shares land borders with ${c.borders.length} countries.`,
      )
    } else {
      clues.push(`An island nation with no land borders.`)
    }
    if (c.currency) clues.push(`Its currency is the ${c.currency}.`)
    clues.push(`Its capital is ${c.capital}.`)
    const acceptable = c.official && c.official !== c.name ? [c.official] : undefined
    push(
      {
        id: id(`buildup:${c.cca3}`),
        type: 'build-up',
        category: 'build-up',
        question: `Name the country from the clues`,
        prompt: { kind: 'text', text: `Name the country - guess early for more points!` },
        answer: c.name,
        clues,
        code: c.cca2,
        extra: { clues, acceptable, code: c.cca2 },
      },
      obscurity(c),
    )
  }
}

// 17. route - "Border Hopper": chain bordering countries from A to B.
// Built on a land-adjacency graph from country.borders; only connected pairs
// within a hop cap are emitted, so impossible pairs (e.g. Argentina→Fiji, an
// island) never appear. Difficulty scales with the shortest-path length.
{
  const adj = new Map()
  for (const c of countries) {
    if (!adj.has(c.cca3)) adj.set(c.cca3, new Set())
    for (const b of c.borders) {
      adj.get(c.cca3).add(b)
      if (!adj.has(b)) adj.set(b, new Set())
      adj.get(b).add(c.cca3)
    }
  }
  // BFS shortest path (node list) or null if unconnected within 8 hops.
  const bfsPath = (from, to) => {
    if (from === to) return [from]
    const prev = new Map()
    const seen = new Set([from])
    let frontier = [from]
    let depth = 0
    while (frontier.length && depth < 8) {
      depth++
      const nextF = []
      for (const n of frontier) {
        for (const m of adj.get(n) ?? []) {
          if (seen.has(m)) continue
          seen.add(m)
          prev.set(m, n)
          if (m === to) {
            const path = [to]
            let cur = to
            while (prev.has(cur)) {
              cur = prev.get(cur)
              path.unshift(cur)
            }
            return path
          }
          nextF.push(m)
        }
      }
      frontier = nextF
    }
    return null
  }

  const HOP_CAP = 5
  const ROUTE_FAME_MIN = 0.5
  const endpoints = countries.filter((c) => c.borders.length > 0 && fame(c) >= ROUTE_FAME_MIN)
  const seenPairs = new Set()
  for (const a of endpoints) {
    const partners = shuffle(
      endpoints.filter((x) => x.cca3 !== a.cca3),
      rng(`route:${a.cca3}`),
    )
    let made = 0
    for (const b of partners) {
      if (made >= 2) break
      const key = [a.cca3, b.cca3].sort().join('-')
      if (seenPairs.has(key)) continue
      const path = bfsPath(a.cca3, b.cca3)
      if (!path) continue
      const optimalSteps = path.length - 1
      if (optimalSteps < 2 || optimalSteps > HOP_CAP) continue // skip trivial neighbours + too-far
      seenPairs.add(key)
      const maxSteps = Math.min(HOP_CAP + 1, optimalSteps + 2)
      push(
        {
          id: id(`route:${a.cca3}:${b.cca3}`),
          type: 'route',
          category: 'route',
          question: `Hop from ${a.name} to ${b.name} across bordering countries`,
          prompt: {
            kind: 'text',
            text: `Chain bordering countries from ${a.name} to ${b.name}.`,
          },
          // answer column is non-null; store the optimal path for reference.
          answer: path,
          from: a.cca3,
          to: b.cca3,
          maxSteps,
          optimalSteps,
          extra: { from: a.cca3, to: b.cca3, maxSteps, optimalSteps },
        },
        Math.min(1, 0.3 + optimalSteps * 0.12),
      )
      made++
    }
  }
}

// --- assign difficulty tiers (absolute thresholds) -----------------------
// Fixed cutoffs, NOT per-category tertiles: a tertile makes "easy" the least-obscure
// *third* of all 195 countries, which still reaches country ~#65 by fame and sweeps
// in mid-obscurity places like Burkina Faso. Absolute thresholds mean "easy" is a
// genuinely famous country everywhere. Categories that set their own tier (ranking,
// where item count drives difficulty) keep it.
const EASY_MAX = 0.5
const HARD_MIN = 0.72
const tierFor = (d) => (d < EASY_MAX ? 'easy' : d < HARD_MIN ? 'medium' : 'hard')
for (const item of q) {
  if (!item.tier) item.tier = tierFor(item.difficulty)
}

// --- write outputs ---
writeFileSync(join(root, 'app/database/geo-questions.json'), JSON.stringify(q, null, 0))

const stats = {}
const tierStats = {}
for (const item of q) {
  stats[item.category] = (stats[item.category] ?? 0) + 1
  tierStats[item.tier] = (tierStats[item.tier] ?? 0) + 1
}
stats.total = q.length
writeFileSync(join(root, 'app/database/stats.json'), JSON.stringify(stats, null, 2))

console.log(`generated ${q.length} questions`)
console.log('per category:', JSON.stringify(stats, null, 0))
console.log('by tier:', JSON.stringify(tierStats))
for (const [k, v] of Object.entries(stats).sort()) console.log(`  ${k}: ${v}`)
