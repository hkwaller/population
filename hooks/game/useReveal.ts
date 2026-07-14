
import { useIshStore } from '@/app/state'
import { useUpdateGameState } from '../useUpdateGameState'

export const useReveal = () => {
  const { players } = useIshStore()
  const { updateGameState } = useUpdateGameState()

  const reveal = async (payload: undefined) => {
    await updateGameState({
      command: 'reveal',
      players: players,
    })
  }

  return { reveal }
}
