
import { usePopStore } from '@/app/state'
import { sample, uniqBy } from 'lodash'
import { TQuestion } from '@/app/types'
import { useUpdateGameState } from '../useUpdateGameState'

export const useRematch = () => {
  const { players, amountQuestions, capAnswers, hideQuestions, selectedCategories, questions } =
    usePopStore()
  const { updateGameState } = useUpdateGameState()

  const rematch = async (payload: undefined) => {
    const updatedGameData = {
      command: 'rematch' as const,
      answeredQuestions: [],
      skippedQuestions: [],
      amountQuestions: amountQuestions,
      capAnswers: capAnswers,
      hideQuestions: hideQuestions,
      players: players.map((p) => ({ ...p, answers: [], score: 0 })),
    }

    const pool = uniqBy(questions, 'id')
    const firstQuestion = sample(pool) as TQuestion

    await updateGameState({
      ...updatedGameData,
      currentQuestion: firstQuestion,
      selectedCategories: selectedCategories,
      players: players.map((p) => ({ ...p, answers: [], score: 0 })),
    })
  }

  return { rematch }
}
