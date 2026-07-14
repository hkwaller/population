import type { TQuestion } from '@/app/types'

export const DAILY_SIZE = 8

/** UTC calendar day, e.g. "2026-07-14". Everyone worldwide gets the same set. */
export function dateKeyUTC(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function hashSeed(s: string): number {
  let h = 1779033703 ^ s.length
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}

/** Small deterministic PRNG so a given date always yields the same quiz. */
function mulberry32(a: number) {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Deterministically pick the day's questions, round-robining across categories
 * for variety. Same dateKey → same set, everywhere, with no persistence.
 */
export function pickDaily(all: TQuestion[], dateKey: string, size = DAILY_SIZE): TQuestion[] {
  const rand = mulberry32(hashSeed(dateKey))
  const shuffle = <T>(arr: T[]): T[] => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  const byCat = new Map<string, TQuestion[]>()
  for (const q of all) {
    const list = byCat.get(q.category) ?? []
    list.push(q)
    byCat.set(q.category, list)
  }

  const cats = shuffle([...byCat.keys()])
  const pools = new Map(cats.map((c) => [c, shuffle(byCat.get(c)!)]))
  const picked: TQuestion[] = []
  let step = 0
  while (picked.length < size && cats.length > 0 && step < size * 20) {
    const c = cats[step % cats.length]
    const pool = pools.get(c)!
    if (pool.length) picked.push(pool.pop()!)
    step++
  }
  return picked
}
