import { useIshStore } from '@/app/state'
import { AnswerPayload } from '@/app/types'
import { useUpdateGameState } from '../useUpdateGameState'

export const useAnswer = () => {
  const { answerQuestion } = useIshStore()
  const { updateGameState } = useUpdateGameState()

  const answer = async (payload: AnswerPayload) => {
    answerQuestion(payload.id, payload.answer, payload.questionId, payload.elapsedMs)
    // Read players AFTER answerQuestion commits to avoid stale-closure bug
    const freshPlayers = useIshStore.getState().players
    await updateGameState({ players: freshPlayers })
  }

  return { answer }
}
