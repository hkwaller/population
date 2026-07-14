
import { useIshStore } from '@/app/state'
import { useUpdateGameState } from '../useUpdateGameState'

export const useEnd = () => {
  const { players, answeredQuestions, currentQuestion, closeModals } = useIshStore()
  const { updateGameState } = useUpdateGameState()

  const end = async (payload: undefined) => {
    closeModals()

    const updatedPlayers = players.map((p) => ({
      ...p,
      score: p.answers.reduce((acc, answer) => acc + answer.score, 0),
    }))

    await updateGameState({
      answeredQuestions: [...answeredQuestions, currentQuestion!],
      players: updatedPlayers,
      command: 'end',
      endedAt: new Date().toISOString(),
    })
  }

  return { end }
}
