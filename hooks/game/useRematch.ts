import { usePopStore } from '@/app/state'
import { TQuestion } from '@/app/types'
import { useUpdateGameState } from '../useUpdateGameState'
import { useSupabase } from '../useSupabase'
import { sampleQuestions } from '@/lib/sampleQuestions'

export const useRematch = () => {
  const {
    players,
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

  const rematch = async (payload: undefined) => {
    // Re-fetch and re-sample a fresh pool instead of reusing the previous game's
    // `questions` (which replayed the same round). Exclude every question shown
    // on this device today - which already covers the round just played - so
    // successive rematches keep serving new questions until the bank runs low.
    const fetched = await fetchQuestionsByCategories(selectedCategories, amountQuestions)
    const sampled = sampleQuestions(fetched, {
      selectedCategories,
      selectedDifficulty,
      amountQuestions,
      excludeIds: new Set(getSeenQuestionIds()),
    })

    if (sampled.length === 0) {
      console.error(
        '[useRematch] No questions returned from Supabase for categories:',
        selectedCategories,
      )
      return
    }

    const [firstQuestion] = sampled as TQuestion[]

    updateGame({ questions: sampled })

    await updateGameState({
      command: 'rematch',
      answeredQuestions: [],
      skippedQuestions: [],
      amountQuestions,
      showQuestions,
      typeCapitals,
      questions: sampled,
      currentQuestion: firstQuestion,
      selectedCategories,
      players: players.map((p) => ({ ...p, answers: [], score: 0 })),
    })
  }

  return { rematch }
}
