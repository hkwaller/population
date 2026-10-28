import { useRoom } from '@/hooks/partyRoom'
import type { AnswerPayload, JoinPayload } from '@/app/types'
export const useJoin = () => {
  const { send } = useRoom()
  return { join: (payload: JoinPayload) => send({ type: 'join', player: payload }) }
}
