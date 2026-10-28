import { useRoom } from '@/hooks/partyRoom'
import type { AnswerPayload, JoinPayload } from '@/app/types'
export const useAnswer = () => {
  const { send } = useRoom()
  return { answer: (payload: AnswerPayload) => send({ type: 'answer', payload }) }
}
