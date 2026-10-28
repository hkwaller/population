import { usePopStore } from '@/app/state'
import { useRoom } from '@/hooks/partyRoom'
import { useSupabase } from '../useSupabase'
import { useAdFree } from '../useAdFree'
import { StartPayload } from '@/app/types'
import { sampleQuestions } from '@/lib/sampleQuestions'

export const useStart = () => {
  // The device issuing `start` is the host; publish its ad-free status so the
  // whole room inherits the perk (see GameState.hostAdFree).
  const { adFree: hostAdFree } = useAdFree()
  const {
    amountQuestions,
    showQuestions,
    confidenceMode,
    answerModes,
    selectedCategories,
    selectedDifficulty,
    getSeenQuestionIds,
    updateGame,
  } = usePopStore()
  const { send } = useRoom()
  const { fetchQuestionsByCategories } = useSupabase()

  const start = async (payload: StartPayload) => {
    const fetched = await fetchQuestionsByCategories(selectedCategories, amountQuestions)

    const sampled = sampleQuestions(fetched, {
      selectedCategories,
      selectedDifficulty,
      amountQuestions,
      excludeIds: new Set(getSeenQuestionIds()),
    })

    if (sampled.length === 0) {
      console.error(
        '[useStart] No questions returned from Supabase for categories:',
        selectedCategories,
      )
      return
    }

    updateGame({ questions: sampled })

    await send({
      type: 'start',
      questions: sampled,
      config: {
        amountQuestions,
        showQuestions,
        answerModes,
        selectedCategories,
        confidenceMode: confidenceMode,
        hostAdFree: hostAdFree,
      },
    })
  }

  return { start }
}
