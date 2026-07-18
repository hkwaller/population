
import { usePopStore } from '@/app/state'
import { useUpdateGameState } from '../useUpdateGameState'

export const useSetup = () => {
  const { updateGame, amountQuestions, showQuestions, answerModes, selectedCategories } =
    usePopStore()
  const { updateGameState } = useUpdateGameState()

  const setup = async (payload: undefined) => {
    updateGame({
      me: undefined,
    })

    // Room creation is handled by RoomProvider's initialStorage.
    // Here we just reset the state for a fresh game (also handles rematch).
    await updateGameState({
      command: 'idle',
      amountQuestions: amountQuestions,
      currentQuestion: undefined,
      answeredQuestions: [],
      skippedQuestions: [],
      selectedCategories: selectedCategories,
      showQuestions: showQuestions,
      answerModes: answerModes,
      players: [],
      hostAdFree: false,
    })
  }

  return { setup }
}
