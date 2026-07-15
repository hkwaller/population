import { usePopStore } from '@/app/state'
import { useUpdateGameState } from '../useUpdateGameState'
import { useSupabase } from '../useSupabase'
import { StartPayload } from '@/app/types'
import { sampleQuestions } from '@/lib/sampleQuestions'

export const useStart = () => {
  const {
    nextQuestion,
    amountQuestions,
    showQuestions,
    typeCapitals,
    selectedCategories,
    selectedDifficulty,
    getSeenQuestionIds,
    updateGame,
  } = usePopStore()
  const { updateGameState } = useUpdateGameState()
  const { fetchQuestionsByCategories } = useSupabase()

  const start = async (payload: StartPayload) => {
    const fetched = await fetchQuestionsByCategories(selectedCategories, amountQuestions)

    const sampled = sampleQuestions(fetched, {
      selectedCategories,
      selectedDifficulty,
      amountQuestions,
      excludeIds: new Set(getSeenQuestionIds()),
    })

    if (sampled.length === 0) {
      console.error('[useStart] No questions returned from Supabase for categories:', selectedCategories)
      return
    }

    const [first] = sampled

    updateGame({ questions: sampled })

    await updateGameState({
      command: 'start',
      currentQuestion: first,
      answeredQuestions: [],
      skippedQuestions: [],
      questions: sampled,
      amountQuestions: amountQuestions,
      showQuestions: showQuestions,
      typeCapitals: typeCapitals,
      selectedCategories: selectedCategories,
    })
  }

  return { start }
}
