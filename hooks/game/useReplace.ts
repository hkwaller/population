import { useRoom } from '@/hooks/partyRoom'
export const useReplace = () => {
  const { state, send } = useRoom()
  return {
    replace: async (_payload?: undefined) => {
      if (state?.currentQuestion)
        await send({ type: 'replace', questionId: state.currentQuestion.id })
    },
  }
}
