import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import stats from '../app/database/stats.json'
import {
  type AnswerValue,
  type ChoiceQuestion,
  type LatLng,
  type MapQuestion,
  type RankQuestion,
  type SliderQuestion,
  TQuestion,
} from '@/app/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import { sample } from 'lodash'
import { animals, adjectives } from '@/app/mockData'

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
const CHOICE_SPEED_BONUS = 300

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

function scoreSlider(question: SliderQuestion, guess: number) {
  if (Number.isNaN(guess)) return 0
  if (guess === question.answer) return MAX_SCORE
  const range = question.upper_bound - question.lower_bound
  if (range <= 0) return 0
  const normError = Math.min(1, Math.abs(guess - question.answer) / range)
  return Math.max(0, Math.round(MAX_SCORE * (1 - normError)))
}

function scoreMap(question: MapQuestion, guess: LatLng, insideCountry?: boolean) {
  // Locate-the-country is right/wrong-ish: a guess that lands anywhere inside the
  // country's actual borders is correct. Containment is decided by the caller (it
  // needs the map geometry); we only fall back to distance-based partial credit
  // when the guess misses the country entirely.
  if (insideCountry) return MAX_SCORE
  const d = haversineKm(guess, question.answer)
  const falloff = question.falloffKm ?? MAP_FALLOFF_KM
  return Math.max(0, Math.round(MAX_SCORE * (1 - d / falloff)))
}

function scoreChoice(question: ChoiceQuestion, guess: string, elapsedMs?: number) {
  if (guess !== question.answer) return 0
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
 * For map questions, `insideCountry` (whether the guess landed within the target
 * country's borders) is computed by the caller from the map geometry — see
 * `scoreGuess` in lib/geo/score.ts, which app code should use instead of this.
 */
export function scoreAnswer(
  question: TQuestion,
  guess: AnswerValue,
  elapsedMs?: number,
  insideCountry?: boolean,
): number {
  switch (question.type) {
    case 'slider':
      return scoreSlider(question, guess as number)
    case 'choice':
      return scoreChoice(question, guess as string, elapsedMs)
    case 'map':
      return scoreMap(question, guess as LatLng, insideCountry)
    case 'rank':
      return scoreRank(question, guess as string[])
    default:
      return 0
  }
}

/** A near-perfect answer worth celebrating (exact slider hit / same-city map guess). */
export function isBullseye(question: TQuestion, score: number) {
  if (question.type === 'choice') return false
  return score >= MAX_SCORE
}

/** Narrow a question to a SliderQuestion, or undefined for choice/map. */
export function asSlider(q?: TQuestion): SliderQuestion | undefined {
  return q?.type === 'slider' ? q : undefined
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
    return {
      ...base,
      type: 'rank',
      items: parse(row.options),
      answer: parse(row.answer),
      order: 'desc',
      unit: row.unit ?? undefined,
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
