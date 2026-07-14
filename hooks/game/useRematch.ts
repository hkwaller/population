import { usePopStore } from '@/app/state'
import { TQuestion } from '@/app/types'
import { useUpdateGameState } from '../useUpdateGameState'
import { useSupabase } from '../useSupabase'
import { sampleQuestions } from '@/lib/sampleQuestions'

export const useRematch = () => {
  const {
    players,
    amountQuestions,
    capAnswers,
    hideQuestions,
    selectedCategories,
    selectedDifficulty,
    questions,
    updateGame,
  } = usePopStore()
  const { updateGameState } = useUpdateGameState()
  const { fetchQuestionsByCategories } = useSupabase()

  const rematch = async (payload: undefined) => {
    // Re-fetch and re-sample a fresh pool instead of reusing the previous game's
    // `questions` (which replayed the same round). Exclude the questions that
    // were just played so the rematch is genuinely different when the bank has
    // enough to spare.
    const fetched = await fetchQuestionsByCategories(selectedCategories, amountQuestions)
    const excludeIds = new Set(questions.filter(Boolean).map((q) => q.id))
    const sampled = sampleQuestions(fetched, {
      selectedCategories,
      selectedDifficulty,
      amountQuestions,
      excludeIds,
    })

    if (sampled.length === 0) {
      console.error('[useRematch] No questions returned from Supabase for categories:', selectedCategories)
      return
    }

    const [firstQuestion] = sampled as TQuestion[]

    updateGame({ questions: sampled })

    await updateGameState({
      command: 'rematch',
      answeredQuestions: [],
      skippedQuestions: [],
      amountQuestions,
      capAnswers,
      hideQuestions,
      questions: sampled,
      currentQuestion: firstQuestion,
      selectedCategories,
      players: players.map((p) => ({ ...p, answers: [], score: 0 })),
    })
  }

  return { rematch }
}
