
import { useUpdateGameState } from '../useUpdateGameState'

export const useShow = () => {
  const { updateGameState } = useUpdateGameState()

  const show = async (payload: undefined) => {
    await updateGameState({
      command: 'show',
    })
  }

  return { show }
}
