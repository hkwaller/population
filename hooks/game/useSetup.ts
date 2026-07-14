
import { usePopStore } from '@/app/state'
import { useUpdateGameState } from '../useUpdateGameState'

export const useSetup = () => {
  const {
    updateGame,
    amountQuestions,
    capAnswers,
    hideQuestions,
    selectedCategories,
    customQuestions,
    customQuestionCategory,
  } = usePopStore()
  const { updateGameState } = useUpdateGameState()

  const setup = async (payload: undefined) => {
    updateGame({
      me: undefined,
    })

    // Room creation is handled by RoomProvider's initialStorage.
    // Here we just reset the state for a fresh game (also handles rematch).
    await updateGameState({
      command: 'idle',
      amountQuestions: customQuestions?.length || amountQuestions,
      currentQuestion: (customQuestions?.length || 0) > 0 ? customQuestions?.[0] : undefined,
      customQuestions: customQuestions ?? [],
      customQuestionCategory: customQuestionCategory ?? undefined,
      customQuestionsAnswered: [],
      answeredQuestions: [],
      skippedQuestions: [],
      selectedCategories: selectedCategories,
      capAnswers: capAnswers,
      hideQuestions: hideQuestions,
      players: [],
    })
  }

  return { setup }
}
