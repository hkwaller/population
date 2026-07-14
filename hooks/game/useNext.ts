
import { usePopStore } from '@/app/state'
import { useUpdateGameState } from '../useUpdateGameState'

export const useNext = () => {
  const { nextQuestion, answeredQuestions, currentQuestion, players, updateGame } = usePopStore()
  const { updateGameState } = useUpdateGameState()

  const next = async (payload: undefined) => {
    const upcoming = nextQuestion()

    // Advancing always hides the reveal; useGame re-derives it to true once
    // every player has answered the new question.
    updateGame({ showQuestionResultModal: false })

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
