import { sampleSize } from 'lodash'

import { Difficulty, TQuestion } from '@/app/types'

type SampleOptions = {
  selectedCategories: string[]
  selectedDifficulty: Difficulty | 'all'
  amountQuestions: number
  /** Question ids to exclude (e.g. a previous round's questions on rematch). */
  excludeIds?: Set<string>
}

/**
 * Turn a freshly-fetched question set into the stratified pool a round draws
 * from. Shared by `useStart` and `useRematch` so both build the pool the same
 * way. Applies the difficulty filter per-category, optionally drops
 * `excludeIds`, then round-robins across categories so a round mixes types
 * instead of clustering. Both the difficulty and exclusion steps fall back to
 * the fuller set when filtering would starve the round.
 */
export function sampleQuestions(
  fetched: TQuestion[],
  { selectedCategories, selectedDifficulty, amountQuestions, excludeIds }: SampleOptions,
): TQuestion[] {
  // Apply the difficulty filter, but only per-category and only when it leaves
  // enough to fill the round — otherwise fall back to that category's full set so
  // an aggressive filter never starves the game of questions.
  let pool =
    selectedDifficulty === 'all'
      ? fetched
      : selectedCategories.flatMap((cat) => {
          const inCat = fetched.filter((q) => q.category === cat)
          const matching = inCat.filter((q) => q.tier === selectedDifficulty)
          return matching.length >= amountQuestions ? matching : inCat
        })

  // Drop previously-played questions when enough fresh ones remain, so a rematch
  // isn't the same round again. If excluding would leave too few, keep the full
  // pool rather than starve the round.
  if (excludeIds && excludeIds.size > 0) {
    const fresh = pool.filter((q) => !excludeIds.has(q.id))
    if (fresh.length >= amountQuestions) pool = fresh
  }

  if (pool.length === 0) return []

  // Stratified sample: round-robin across the selected categories so a round
  // always mixes types instead of clustering on whichever category the DB
  // happened to return first.
  const target = Math.min(amountQuestions * 3, pool.length)
  const byCategory = new Map<string, TQuestion[]>()
  for (const question of pool) {
    const list = byCategory.get(question.category) ?? []
    list.push(question)
    byCategory.set(question.category, list)
  }
  // shuffle each category's questions AND the order categories are visited
  const buckets = sampleSize(
    [...byCategory.values()].map((list) => sampleSize(list, list.length)),
    byCategory.size,
  )
  const sampled: TQuestion[] = []
  let i = 0
  while (sampled.length < target && buckets.some((b) => b.length > 0)) {
    const bucket = buckets[i % buckets.length]
    const picked = bucket.pop()
    if (picked) sampled.push(picked)
    i++
  }

  return sampled
}
