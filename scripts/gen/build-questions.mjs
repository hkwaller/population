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
// Each capital pairs with 3 partners (deduped) instead of being used once → ~3× more.
for (const [a, b] of makePairs(withCapCoords, 2, 'distance-pairs')) {
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

  const genTier = (tier, count, pool, n, difficulty, requireSpread) => {
    let made = 0
    for (let attempt = 0; made < count && attempt < count * 50; attempt++) {
      const pick = shuffle(pool, rng(`rank:${tier}:${attempt}`)).slice(0, n)
      if (pick.length < n) break
      const key = pick
        .map((c) => c.cca3)
        .sort()
        .join('-')
      if (seen.has(key)) continue
      const sorted = [...pick].sort((a, b) => b.population - a.population)
      // reject exact ties (ambiguous) and, for easy, near-ties (too subtle)
      let ok = true
      for (let i = 1; i < sorted.length; i++) {
        const ratio = sorted[i - 1].population / sorted[i].population
        if (ratio === 1 || (requireSpread && ratio < 1.3)) {
          ok = false
          break
        }
      }
      if (!ok) continue
      seen.add(key)
      push(
        {
          id: id(`rank:${tier}:${key}`),
          type: 'rank',
          category: 'ranking',
          question: `Sort these by population - largest first`,
          prompt: { kind: 'text', text: `Sort these by population - largest first` },
          // items live in `options` (array of {label,value}); shuffled presentation order
          options: shuffle(pick, rng(`rank:${tier}:${attempt}:o`)).map((c) => ({
            label: c.name,
            value: c.population,
          })),
          answer: sorted.map((c) => c.name),
          unit: 'people',
          tier,
        },
        difficulty,
      )
      made++
    }
  }
  genTier('easy', 100, famousPool, 3, 0.2, true)
  genTier('medium', 100, withPop, 4, 0.5, false)
  genTier('hard', 100, obscurePool, 5, 0.8, false)
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
