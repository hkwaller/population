import { sampleSize } from 'lodash'
import { usePopStore } from '@/app/state'
import { useUpdateGameState } from '../useUpdateGameState'
import { useSupabase } from '../useSupabase'
import { StartPayload } from '@/app/types'

export const useStart = () => {
  const {
    nextQuestion,
    amountQuestions,
    capAnswers,
    hideQuestions,
    selectedCategories,
    selectedDifficulty,
    updateGame,
  } = usePopStore()
  const { updateGameState } = useUpdateGameState()
  const { fetchQuestionsByCategories } = useSupabase()

  const start = async (payload: StartPayload) => {
    const fetched = await fetchQuestionsByCategories(selectedCategories, amountQuestions)

    // Apply the difficulty filter, but only per-category and only when it leaves
    // enough to fill the round — otherwise fall back to that category's full set so
    // an aggressive filter never starves the game of questions.
    const pool =
      selectedDifficulty === 'all'
        ? fetched
        : selectedCategories.flatMap((cat) => {
            const inCat = fetched.filter((q) => q.category === cat)
            const matching = inCat.filter((q) => q.tier === selectedDifficulty)
            return matching.length >= amountQuestions ? matching : inCat
          })

    if (pool.length === 0) {
      console.error('[useStart] No questions returned from Supabase for categories:', selectedCategories)
      return
    }

    // Stratified sample: round-robin across the selected categories so a round
    // always mixes types instead of clustering on whichever category the DB
    // happened to return first.
    const target = Math.min(amountQuestions * 3, pool.length)
    const byCategory = new Map<string, typeof pool>()
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
    const sampled: typeof pool = []
    let i = 0
    while (sampled.length < target && buckets.some((b) => b.length > 0)) {
      const bucket = buckets[i % buckets.length]
      const picked = bucket.pop()
      if (picked) sampled.push(picked)
      i++
    }
    const [first, ...rest] = sampled

    updateGame({ questions: sampled })

    await updateGameState({
      command: 'start',
      currentQuestion: first,
      answeredQuestions: [],
      skippedQuestions: [],
      questions: sampled,
      amountQuestions: amountQuestions,
      capAnswers: capAnswers,
      hideQuestions: hideQuestions,
      selectedCategories: selectedCategories,
    })
  }

  return { start }
}
