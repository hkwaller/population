import { usePopStore } from '@/app/state'
import { useRoom } from '@/hooks/partyRoom'
export const useSetup = () => {
  const { send } = useRoom()
  return {
    setup: async (_payload?: undefined) => {
      const s = usePopStore.getState()
      s.updateGame({ me: undefined })
      await send({
        type: 'setup',
        config: {
          amountQuestions: s.amountQuestions,
          showQuestions: s.showQuestions,
          confidenceMode: s.confidenceMode,
          answerModes: s.answerModes,
          selectedCategories: s.selectedCategories,
          hostAdFree: false,
        },
      })
    },
  }
}
