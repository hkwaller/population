
import { useIshStore } from '@/app/state'
import { useUpdateGameState } from '../useUpdateGameState'

export const useNext = () => {
  const { nextQuestion, answeredQuestions, currentQuestion, players, updateGame } = useIshStore()
  const { updateGameState } = useUpdateGameState()

  const next = async (payload: undefined) => {
    const upcoming = nextQuestion()

    updateGame({ showQuestionResultModal: true })

    const newAnswered = currentQuestion
      ? [...answeredQuestions.filter(Boolean), currentQuestion]
      : answeredQuestions.filter(Boolean)

    await updateGameState({
      command: 'next',
      answeredQuestions: newAnswered,
      currentQuestion: upcoming ?? undefined,
      players: players,
    })
  }

  return { next }
}
