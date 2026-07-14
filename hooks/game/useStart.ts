import { sampleSize } from 'lodash'
import { useIshStore } from '@/app/state'
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
    customQuestions,
    updateGame,
  } = useIshStore()
  const { updateGameState } = useUpdateGameState()
  const { fetchQuestionsByCategories } = useSupabase()

  const start = async (payload: StartPayload) => {
    if (customQuestions?.length && customQuestions.length > 0) {
      await updateGameState({
        command: 'start',
        selectedCategories: [],
      })
      return
    }

    const pool = await fetchQuestionsByCategories(selectedCategories, amountQuestions)

    if (pool.length === 0) {
      console.error('[useStart] No questions returned from Supabase for categories:', selectedCategories)
      return
    }

    const sampled = sampleSize(pool, Math.min(amountQuestions * 3, pool.length))
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
