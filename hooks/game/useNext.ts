import { useRoom } from '@/hooks/partyRoom'
export const useNext = () => {
  const { state, send } = useRoom()
  return {
    next: async (_payload?: undefined) => {
      if (state?.currentQuestion) await send({ type: 'next', questionId: state.currentQuestion.id })
    },
  }
}
