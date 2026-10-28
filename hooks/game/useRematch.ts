import { usePopStore } from '@/app/state'
import { useRoom } from '@/hooks/partyRoom'
import { useSupabase } from '../useSupabase'
import { sampleQuestions } from '@/lib/sampleQuestions'
import { useStorage } from '@/hooks/partyRoom'

export const useRematch = () => {
  const {
    amountQuestions,
    showQuestions,
    answerModes,
    selectedCategories: deviceCategories,
    selectedDifficulty,
    getSeenQuestionIds,
    updateGame,
  } = usePopStore()
  const { send, state: roomState } = useRoom()
  const { fetchQuestionsByCategories } = useSupabase()
  // The host stamped the room's categories at `start`. Any device can issue
  // `rematch` (the boss may have been handed over to a player who never picked
  // categories on their own device), so the room value wins - falling back to
  // this device's picks only when the room has none (daily/solo).
  const roomCategories = useStorage((root) => root.game?.selectedCategories)

  const rematch = async (payload: undefined) => {
    const selectedCategories = roomCategories?.length ? [...roomCategories] : deviceCategories

    // Re-fetch and re-sample a fresh pool instead of reusing the previous game's
    // `questions` (which replayed the same round). Exclude every question shown
    // on this device today - which already covers the round just played - so
    // successive rematches keep serving new questions until the bank runs low.
    const fetched = await fetchQuestionsByCategories(selectedCategories, amountQuestions)
    const sampled = sampleQuestions(fetched, {
      selectedCategories,
      selectedDifficulty,
      amountQuestions,
      excludeIds: new Set(getSeenQuestionIds()),
    })

    if (sampled.length === 0) {
      console.error(
        '[useRematch] No questions returned from Supabase for categories:',
        selectedCategories,
      )
      return
    }

    updateGame({ questions: sampled })

    await send({
      type: 'rematch',
      questions: sampled,
      config: {
        amountQuestions,
        showQuestions,
        answerModes,
        selectedCategories,
        confidenceMode: roomState?.confidenceMode ?? false,
        hostAdFree: roomState?.hostAdFree ?? false,
      },
    })
  }

  return { rematch }
}
