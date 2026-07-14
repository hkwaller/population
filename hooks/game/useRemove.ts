import { useIshStore } from '@/app/state'
import { RemovePayload } from '@/app/types'
import { useUpdateGameState } from '../useUpdateGameState'

export const useRemove = () => {
  const { players } = useIshStore()
  const { updateGameState } = useUpdateGameState()

  const remove = async (payload: RemovePayload) => {
    const updatedPlayers = players.filter((player) => player.id !== payload)
    await updateGameState({
      players: updatedPlayers,
    })
  }

  return { remove }
}
