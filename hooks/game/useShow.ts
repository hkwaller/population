import { useRoom } from '@/hooks/partyRoom'
export const useShow = () => {
  const { state, send } = useRoom()
  return {
    show: async (_payload?: undefined) => {
      if (state?.currentQuestion) await send({ type: 'show', questionId: state.currentQuestion.id })
    },
  }
}
