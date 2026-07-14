
import { useIshStore } from '@/app/state'
import { flatMap, sample, uniqBy } from 'lodash'
import { generateQuestions } from '@/lib/utils'
import { TQuestion } from '@/app/types'
import { useUpdateGameState } from '../useUpdateGameState'

export const useRematch = () => {
  const {
    players,
    amountQuestions,
    capAnswers,
    hideQuestions,
    customQuestions,
    customQuestionsAnswered,
    selectedCategories,
    questions,
  } = useIshStore()
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

    if (customQuestions?.length && customQuestions.length > 0) {
      const customQuestionsAnsweredLocal = flatMap([
        customQuestionsAnswered,
        customQuestions,
      ]).filter(Boolean)

      const newCustomQuestions = await generateQuestions(
        customQuestions[0].category,
        amountQuestions,
        customQuestionsAnsweredLocal,
      )

      await updateGameState({
        ...updatedGameData,
        currentQuestion: newCustomQuestions.questions[0],
        customQuestions: newCustomQuestions.questions,
        customQuestionCategory: newCustomQuestions.category,
        customQuestionsAnswered: customQuestionsAnsweredLocal,
        amountQuestions: newCustomQuestions.questions.length,
        players: players.map((p) => ({ ...p, answers: [], score: 0 })),
      })

      return
    } else {
      const pool = uniqBy(questions, 'id')
      const firstQuestion = sample(pool) as TQuestion

      await updateGameState({
        ...updatedGameData,
        currentQuestion: firstQuestion,
        customQuestions: [],
        customQuestionsAnswered: [],
        selectedCategories: selectedCategories,
        players: players.map((p) => ({ ...p, answers: [], score: 0 })),
      })
    }
  }

  return { rematch }
}
