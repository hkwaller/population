import { useRoom } from '@/hooks/partyRoom'
export const useBoss = () => {
  const { send } = useRoom()
  return { boss: (payload?: string) => send({ type: 'boss', id: payload }) }
}
