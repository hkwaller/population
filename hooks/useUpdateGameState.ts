import { useMutation } from '@/liveblocks.config'
import type { GameState } from '@/liveblocks.config'

export const useUpdateGameState = () => {
  const updateGameState = useMutation(({ storage }, patch: Partial<GameState>) => {
    const game = storage.get('game')
    ;(Object.entries(patch) as [keyof GameState, GameState[keyof GameState]][]).forEach(
      ([key, value]) => {
        game.set(key, value as any)
      },
    )
  }, [])

  return { updateGameState }
}
