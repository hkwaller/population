import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import stats from '../app/database/stats.json'
import {
  type AnswerValue,
  type BuildUpQuestion,
  type ChoiceQuestion,
  type HigherLowerQuestion,
  type LatLng,
  type MapQuestion,
  type OddOneOutQuestion,
  type RankQuestion,
  type ScoreOpts,
  type SliderQuestion,
  TQuestion,
} from '@/app/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import { sample } from 'lodash'
import { animals, adjectives } from '@/app/mockData'
import { byCca3 } from '@/lib/geo/countries'

export const isDevelopment = process.env.DEVELOPMENT === 'true'
export const devId = '42-sneaky-geese'
export const coolColors = [
  'bg-blue-200',
  'bg-green-200',
  'bg-pink-200',
  'bg-purple-200',
  'bg-teal-200',
  'bg-orange-200',
  'bg-indigo-200',
  'bg-sky-200',
  'bg-emerald-200',
  'bg-amber-200',
]

// --- Unified scoring (higher is better, 0…MAX_SCORE) ---------------------
// The geography game mixes estimation (slider/map, scored by proximity) with
// exact-answer rounds (choice, correct + speed bonus). All produce a 0..1000
// score so a single "highest total wins" leaderboard works across types.

export const MAX_SCORE = 1000
/** Distance (km) at which a map guess scores 0, unless the question overrides it. */
export const MAP_FALLOFF_KM = 2500
/** A choice answered within this window earns the full speed bonus decay curve. */
export const CHOICE_TIME_LIMIT_MS = 15000
const CHOICE_BASE = 700
/** Max points a correct choice can earn on top of CHOICE_BASE, decaying to 0 over CHOICE_TIME_LIMIT_MS. */
export const CHOICE_SPEED_BONUS = 300
/** Points docked per broken hop on a route question (non-adjacent or revisited step). */
export const ROUTE_HOP_PENALTY = 100

/** Great-circle distance between two lat/lng points, in kilometres. */
export function haversineKm(a: LatLng, b: LatLng) {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

function scoreSlider(question: SliderQuestion, guess: number, confidence?: number) {
  if (Number.isNaN(guess)) return 0
  const range = question.upper_bound - question.lower_bound
  if (range <= 0) return 0
  // Confidence mode: the player commits a band [guess ± confidence]. A narrow band
  // that CONTAINS the answer scores big; a wide band scores little; a band that
  // misses the answer scores 0. Rewards calibration over a lucky point guess.
  if (confidence != null) {
    const inBand = Math.abs(guess - question.answer) <= confidence
    if (!inBand) return 0
    const normWidth = Math.min(1, confidence / range)
    return Math.max(0, Math.round(MAX_SCORE * (1 - normWidth)))
  }
  if (guess === question.answer) return MAX_SCORE
  const normError = Math.min(1, Math.abs(guess - question.answer) / range)
  return Math.max(0, Math.round(MAX_SCORE * (1 - normError)))
}

function scoreMap(
  question: MapQuestion,
  guess: LatLng,
  opts?: { insideCountry?: boolean; confidence?: number },
) {
  const falloff = question.falloffKm ?? MAP_FALLOFF_KM
  const d = haversineKm(guess, question.answer)
  // Confidence mode: the player commits a circle of radius `confidence` km around
  // the pin. Tight circle covering the answer scores big; wide circle scores little;
  // a circle that misses scores 0.
  if (opts?.confidence != null) {
    if (d > opts.confidence) return 0
    const normRadius = Math.min(1, opts.confidence / falloff)
    return Math.max(0, Math.round(MAX_SCORE * (1 - normRadius)))
  }
  // Locate-the-country is right/wrong-ish: a guess that lands anywhere inside the
  // country's actual borders is correct. Containment is decided by the caller (it
  // needs the map geometry); we only fall back to distance-based partial credit
  // when the guess misses the country entirely.
  if (opts?.insideCountry) return MAX_SCORE
  return Math.max(0, Math.round(MAX_SCORE * (1 - d / falloff)))
}

function scoreChoice(question: ChoiceQuestion, guess: string, elapsedMs?: number) {
  return scoreExact(guess === question.answer, elapsedMs)
}

/**
 * Shared right/wrong + speed-bonus scoring for the "pick one label" family
 * (choice, higher-lower, odd-one-out). Wrong → 0; correct → base + a bonus that
 * decays to 0 over CHOICE_TIME_LIMIT_MS. No timing → full base + bonus.
 */
function scoreExact(correct: boolean, elapsedMs?: number) {
  if (!correct) return 0
  if (elapsedMs == null) return CHOICE_BASE + CHOICE_SPEED_BONUS
  const speed = Math.max(0, 1 - elapsedMs / CHOICE_TIME_LIMIT_MS)
  return CHOICE_BASE + Math.round(CHOICE_SPEED_BONUS * speed)
}

/**
 * Score a reordering by (normalised) Kendall-tau: full marks for the exact order,
 * partial credit for getting most pairs right, 0 for fully reversed. Rewards being
 * close, in keeping with the slider/map estimation rounds.
 */
function scoreRank(question: RankQuestion, guess: string[]) {
  const correct = question.answer
  const n = correct.length
  if (n < 2) return MAX_SCORE
  const pos = new Map(guess.map((label, i) => [label, i]))
  let inversions = 0
  let comparable = 0
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const pa = pos.get(correct[i])
      const pb = pos.get(correct[j])
      if (pa == null || pb == null) continue
      comparable++
      if (pa > pb) inversions++ // correct[i] should precede correct[j] but doesn't
    }
  }
  if (comparable === 0) return 0
  return Math.max(0, Math.round(MAX_SCORE * (1 - inversions / comparable)))
}

/**
 * Score a guess against a question. Higher is better; range 0..MAX_SCORE.
 * `opts` carries scoring modifiers the raw question can't provide: `insideCountry`
 * (map point-in-polygon, computed by the caller from geometry - see `scoreGuess` in
 * lib/geo/score.ts, which app code should use instead of this), and `confidence`
 * (the band/radius for confidence mode).
 */
export function scoreAnswer(
  question: TQuestion,
  guess: AnswerValue,
  elapsedMs?: number,
  opts?: ScoreOpts,
): number {
  switch (question.type) {
    case 'slider':
      return scoreSlider(question, guess as number, opts?.confidence)
    case 'choice':
      return scoreChoice(question, guess as string, elapsedMs)
    case 'map':
      return scoreMap(question, guess as LatLng, {
        insideCountry: opts?.insideCountry,
        confidence: opts?.confidence,
      })
    case 'rank':
      return scoreRank(question, guess as string[])
    case 'higher-lower':
      return scoreExact(guess === question.answer, elapsedMs)
    case 'odd-one-out':
      return scoreExact(guess === question.answer, elapsedMs)
    case 'build-up':
      return scoreBuildUp(question, guess as string, opts?.cluesUsed)
    case 'route':
      return scoreRoute(opts?.routeComplete, opts?.routeWrongHops)
    default:
      return 0
  }
}

/** Question families scored right/wrong + speed bonus - never a "bullseye". */
const EXACT_TYPES = new Set<TQuestion['type']>(['choice', 'higher-lower', 'odd-one-out'])

/** Normalize a free-text answer for fuzzy comparison (case/diacritics/punct-insensitive). */
function normalizeText(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * Score a build-up guess. Must match the answer (or an accepted alias); once
 * correct, the score decays with how many clues were revealed at lock-in - guess
 * early (few clues) for near-full marks, late (all clues) for a sliver.
 */
function scoreBuildUp(question: BuildUpQuestion, guess: string, cluesUsed?: number) {
  const g = normalizeText(guess ?? '')
  if (!g) return 0
  const targets = [question.answer, ...(question.acceptable ?? [])].map(normalizeText)
  if (!targets.includes(g)) return 0
  const total = Math.max(1, question.clues.length)
  const used = Math.min(total, Math.max(1, cluesUsed ?? total))
  return Math.max(0, Math.round((MAX_SCORE * (total - used + 1)) / total))
}

/**
 * Score a route guess. The input only ever adds real, connected hops to the path,
 * so a route that actually reaches the destination (`complete`) starts at full
 * marks; every impossible hop the player *attempted* along the way docks
 * `ROUTE_HOP_PENALTY`. A route that never connects `from` to `to` scores 0. The
 * score never drops below 0. `complete`/`wrongHops` are computed against the
 * adjacency graph by the caller - see scoreGuess.
 */
function scoreRoute(complete?: boolean, wrongHops?: number) {
  if (!complete) return 0
  return Math.max(0, MAX_SCORE - (wrongHops ?? 0) * ROUTE_HOP_PENALTY)
}

/**
 * Normalise a stored route answer. Accepts the `{ path, wrong }` object the input
 * now produces, and tolerates a bare `string[]` (a legacy/plain path with no logged
 * wrong hops) so older data and simple callers keep working.
 */
export function asRouteAnswer(v: AnswerValue | undefined): { path: string[]; wrong: string[] } {
  if (Array.isArray(v)) return { path: v as string[], wrong: [] }
  if (v && typeof v === 'object' && 'path' in v) {
    const o = v as { path?: unknown; wrong?: unknown }
    return {
      path: Array.isArray(o.path) ? (o.path as string[]) : [],
      wrong: Array.isArray(o.wrong) ? (o.wrong as string[]) : [],
    }
  }
  return { path: [], wrong: [] }
}

/** A near-perfect answer worth celebrating (exact slider hit / same-city map guess). */
export function isBullseye(question: TQuestion, score: number) {
  if (EXACT_TYPES.has(question.type)) return false
  return score >= MAX_SCORE
}

/** Narrow a question to a SliderQuestion, or undefined for choice/map. */
export function asSlider(q?: TQuestion): SliderQuestion | undefined {
  return q?.type === 'slider' ? q : undefined
}

/**
 * Force a rank question to read largest-first. The bank historically shipped a
 * mix of `desc` ("largest first") and `asc` ("smallest first") questions, but the
 * drag helper text, reveal, and scoring all assume largest-first - so `asc`
 * questions contradicted themselves (the player was told "most populous at the
 * top" while the prompt said "smallest first" and scoring followed the data).
 * We now always present largest-first: flip any `asc` question by reversing the
 * answer and rewriting the "smallest first" wording. Idempotent for `desc`.
 */
export function toLargestFirstRank(q: RankQuestion): RankQuestion {
  if (q.order !== 'asc') return q
  const relabel = (s: string) => s.replace(/smallest first/gi, 'largest first')
  return {
    ...q,
    answer: [...q.answer].reverse(),
    order: 'desc',
    question: relabel(q.question),
    prompt:
      q.prompt?.kind === 'text' ? { ...q.prompt, text: relabel(q.prompt.text) } : q.prompt,
  }
}

/** Convert a raw Supabase `questions` row into a typed TQuestion. */
export function normalizeQuestionRow(row: any): TQuestion {
  const base = {
    id: row.id,
    category: row.category,
    question: row.question,
    prompt: row.prompt ?? undefined,
    difficulty: row.difficulty != null ? Number(row.difficulty) : undefined,
    tier: row.tier ?? undefined,
  }
  const type = (row.type ?? 'slider') as TQuestion['type']
  // Type-specific fields with no dedicated column live in the `extra` jsonb blob.
  const extra: Record<string, any> =
    typeof row.extra === 'string' ? JSON.parse(row.extra) : (row.extra ?? {})

  if (type === 'choice') {
    const options = Array.isArray(row.options)
      ? row.options
      : typeof row.options === 'string'
        ? JSON.parse(row.options)
        : []
    return { ...base, type: 'choice', options, answer: String(row.answer) }
  }

  if (type === 'map') {
    const a = typeof row.answer === 'string' ? JSON.parse(row.answer) : row.answer
    return {
      ...base,
      type: 'map',
      answer: { lat: Number(a.lat), lng: Number(a.lng) },
      falloffKm: row.falloff_km != null ? Number(row.falloff_km) : undefined,
      ccn3: row.ccn3 != null ? String(row.ccn3) : undefined,
    }
  }

  if (type === 'rank') {
    const parse = (v: any) => (typeof v === 'string' ? JSON.parse(v) : (v ?? []))
    // items are stored in the `options` column (array of {label, value} objects)
    return toLargestFirstRank({
      ...base,
      type: 'rank',
      items: parse(row.options),
      answer: parse(row.answer),
      order: extra.order === 'asc' ? 'asc' : 'desc',
      unit: row.unit ?? undefined,
    })
  }

  if (type === 'higher-lower') {
    return {
      ...base,
      type: 'higher-lower',
      left: extra.left,
      right: extra.right,
      metric: extra.metric ?? '',
      answer: String(row.answer) === 'right' ? 'right' : 'left',
    }
  }

  if (type === 'odd-one-out') {
    const options = Array.isArray(row.options)
      ? row.options
      : typeof row.options === 'string'
        ? JSON.parse(row.options)
        : []
    return {
      ...base,
      type: 'odd-one-out',
      options,
      answer: String(row.answer),
      sharedProperty: extra.sharedProperty ?? '',
      optionCodes: extra.optionCodes ?? undefined,
    }
  }

  if (type === 'build-up') {
    return {
      ...base,
      type: 'build-up',
      clues: extra.clues ?? [],
      answer: String(row.answer),
      acceptable: extra.acceptable ?? undefined,
      code: extra.code ?? undefined,
    }
  }

  if (type === 'route') {
    return {
      ...base,
      type: 'route',
      from: extra.from,
      to: extra.to,
      maxSteps: Number(extra.maxSteps ?? 5),
      optimalSteps: Number(extra.optimalSteps ?? 1),
    }
  }

  return {
    ...base,
    type: 'slider',
    answer: Number(row.answer),
    lower_bound: Number(row.lower_bound),
    upper_bound: Number(row.upper_bound),
    unit: row.unit ?? undefined,
  }
}

/** Render any answer value (number / option / point / ordering) as a display string. */
export function formatAnswerValue(v: AnswerValue | undefined): string {
  if (v == null) return ''
  if (typeof v === 'number') return v.toLocaleString()
  if (typeof v === 'string') return v
  if (Array.isArray(v)) return v.join(' › ')
  // A route answer: render country names, not raw cca3 codes.
  if ('path' in v) return v.path.map((c) => byCca3.get(c)?.name ?? c).join(' › ')
  return `${v.lat.toFixed(1)}°, ${v.lng.toFixed(1)}°`
}

/**
 * Compact number for slider labels: 55_000_000 → "55M", 1_400_000_000 → "1.4B".
 * Keeps small numbers (years, percentages, distances < 1M) exactly as typed so we
 * never show "1,990" for a year. One decimal, trailing ".0" trimmed.
 */
export function formatCompactNumber(n: number): string {
  const abs = Math.abs(n)
  const trim = (v: number) => Number(v.toFixed(1)).toString()
  if (abs >= 1_000_000_000) return `${trim(n / 1_000_000_000)}B`
  if (abs >= 1_000_000) return `${trim(n / 1_000_000)}M`
  return n.toString()
}

export function makeId() {
  const animal = sample(animals)
  const adjective = sample(adjectives)
  const number = Math.floor(Math.random() * 100)

  return `${adjective}-${animal}-${number}`
}

export const playerIcons = [
  'Alien',
  'Anchor',
  'Atom',
  'Award',
  'Banana',
  'Bike',
  'Bird',
  'Boat',
  'Cat',
  'Coffee',
  'Crown',
  'Dog',
  'Flame',
  'Ghost',
  'Glasses',
  'Hammer',
  'Heart',
  'Rocket',
  'Star',
  'Zap',
]

export const colors = [
  { id: 'red', class: 'bg-rose-400' },
  { id: 'orange', class: 'bg-orange-400' },
  { id: 'amber', class: 'bg-amber-400' },
  { id: 'yellow', class: 'bg-yellow-400' },
  { id: 'green', class: 'bg-emerald-400' },
  { id: 'teal', class: 'bg-teal-400' },
  { id: 'cyan', class: 'bg-cyan-400' },
  { id: 'blue', class: 'bg-blue-400' },
  { id: 'indigo', class: 'bg-indigo-400' },
  { id: 'purple', class: 'bg-violet-400' },
  { id: 'pink', class: 'bg-pink-400' },
]

export const categoryBackgroundColors = [
  'bg-rose-300',
  'bg-orange-400',
  'bg-amber-400',
  'bg-yellow-400',
  'bg-lime-400',
  'bg-green-400',
  'bg-emerald-400',
  'bg-teal-400',
  'bg-cyan-400',
  'bg-sky-400',
  'bg-blue-400',
  'bg-indigo-400',
  'bg-violet-400',
  'bg-fuchsia-400',
  'bg-pink-400',
]

const stat = (key: string): number => (stats as Record<string, number>)[key] ?? 0

// Geography categories. `group` drives internal grouping; `tier` splits the
// category picker into Main (the crowd-pleasers) and Special (the deep cuts).
// ids match the generator output in scripts/gen/build-questions.mjs and stats.json.
export const categories = [
  {
    id: 'flags',
    name: 'Flags',
    icon: 'Flag',
    group: 'core',
    tier: 'main',
    bg: categoryBackgroundColors[0],
    count: stat('flags'),
  },
  {
    id: 'outline',
    name: 'Country Shapes',
    icon: 'Map',
    group: 'core',
    tier: 'main',
    bg: categoryBackgroundColors[1],
    count: stat('outline'),
  },
  {
    id: 'borders',
    name: 'Borders',
    icon: 'Waypoints',
    group: 'core',
    tier: 'main',
    bg: categoryBackgroundColors[2],
    count: stat('borders'),
  },
  {
    id: 'capitals',
    name: 'Capitals',
    icon: 'Landmark',
    group: 'core',
    tier: 'main',
    bg: categoryBackgroundColors[3],
    count: stat('capitals'),
  },
  {
    id: 'ranking',
    name: 'Rank by Population',
    icon: 'ArrowDownWideNarrow',
    group: 'quickfire',
    tier: 'main',
    bg: categoryBackgroundColors[12],
    count: stat('ranking'),
  },
  {
    id: 'locate',
    name: 'Locate It',
    icon: 'MapPin',
    group: 'map',
    tier: 'main',
    bg: categoryBackgroundColors[5],
    count: stat('locate'),
  },
  {
    id: 'which-bigger',
    name: 'Which is Bigger?',
    icon: 'Scale',
    group: 'quickfire',
    tier: 'main',
    bg: categoryBackgroundColors[8],
    count: stat('which-bigger'),
  },
  {
    id: 'higher-lower',
    name: 'Higher or Lower?',
    icon: 'ArrowUpDown',
    group: 'quickfire',
    tier: 'main',
    bg: categoryBackgroundColors[13],
    count: stat('higher-lower'),
  },
  {
    id: 'odd-one-out',
    name: 'Odd One Out',
    icon: 'Shuffle',
    group: 'quickfire',
    tier: 'main',
    bg: categoryBackgroundColors[14],
    count: stat('odd-one-out'),
  },
  {
    id: 'build-up',
    name: 'Name It',
    icon: 'Lightbulb',
    group: 'quickfire',
    tier: 'main',
    bg: categoryBackgroundColors[0],
    count: stat('build-up'),
  },
  {
    id: 'route',
    name: 'Border Hopper',
    icon: 'Route',
    group: 'map',
    tier: 'special',
    bg: categoryBackgroundColors[5],
    count: stat('route'),
  },
  {
    id: 'area',
    name: 'Land Area',
    icon: 'Maximize2',
    group: 'sliders',
    tier: 'special',
    bg: categoryBackgroundColors[6],
    count: stat('area'),
  },
  {
    id: 'distance',
    name: 'Distances',
    icon: 'Ruler',
    group: 'sliders',
    tier: 'special',
    bg: categoryBackgroundColors[7],
    count: stat('distance'),
  },
  {
    id: 'currency',
    name: 'Currencies',
    icon: 'Coins',
    group: 'quickfire',
    tier: 'special',
    bg: categoryBackgroundColors[9],
    count: stat('currency'),
  },
  {
    id: 'language',
    name: 'Languages',
    icon: 'Languages',
    group: 'quickfire',
    tier: 'special',
    bg: categoryBackgroundColors[10],
    count: stat('language'),
  },
  {
    id: 'continent',
    name: 'Continents',
    icon: 'Globe',
    group: 'quickfire',
    tier: 'special',
    bg: categoryBackgroundColors[11],
    count: stat('continent'),
  },
  {
    id: 'population',
    name: 'Population',
    icon: 'Users',
    group: 'core',
    tier: 'special',
    bg: categoryBackgroundColors[4],
    count: stat('population'),
  },
] as const

/** How a player answers a given category: pick one of four options, or type it. */
export type AnswerMode = 'choice' | 'input'
export type AnswerModes = Record<string, AnswerMode>

/**
 * Categories whose `choice` questions can also be answered by typing. All three
 * resolve to a country/capital name, so `TypedAnswerInput` can autocomplete them
 * against countries.json. Other choice categories (currency, language, …) have no
 * such canonical pool, so they stay multiple-choice only.
 */
export const INPUT_CAPABLE_CATEGORIES = new Set(['capitals', 'flags', 'borders'])

/** True when this question should render the typed-input UI instead of options. */
export function isInputMode(
  question: TQuestion | undefined,
  answerModes: AnswerModes | undefined,
): boolean {
  if (!question || question.type !== 'choice') return false
  if (!INPUT_CAPABLE_CATEGORIES.has(question.category)) return false
  return answerModes?.[question.category] === 'input'
}
