import { BossPayload } from '@/app/types'
import { useUpdateGameState } from '../useUpdateGameState'

export const useBoss = () => {
  const { updateGameState } = useUpdateGameState()

  const boss = async (payload: BossPayload) => {
    console.log('🚀 ~ boss ~ payload:', payload)
    await updateGameState({ boss: payload })
  }

  return { boss }
}
