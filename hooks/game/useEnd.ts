import { useRoom } from '@/hooks/partyRoom'
export const useEnd = () => {
  const { state, send } = useRoom()
  return {
    end: async (_payload?: undefined) => {
      if (state?.currentQuestion) await send({ type: 'end', questionId: state.currentQuestion.id })
    },
  }
}
