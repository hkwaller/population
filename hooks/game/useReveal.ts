import { useRoom } from '@/hooks/partyRoom'
export const useReveal = () => {
  const { state, send } = useRoom()
  return {
    reveal: async (_payload?: undefined) => {
      if (state?.currentQuestion)
        await send({ type: 'reveal', questionId: state.currentQuestion.id })
    },
  }
}
