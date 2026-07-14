
import { useIshStore } from '@/app/state'
import { useUpdateGameState } from '../useUpdateGameState'

export const useReplace = () => {
  const { replaceQuestion, skippedQuestions, currentQuestion } = useIshStore()
  const { updateGameState } = useUpdateGameState()

  const replace = async (payload: undefined) => {
    const question = replaceQuestion()

    await updateGameState({
      command: 'replace',
      currentQuestion: question,
      skippedQuestions: [...skippedQuestions, currentQuestion!],
    })
  }

  return { replace }
}
