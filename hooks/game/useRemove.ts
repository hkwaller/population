import { useRoom } from '@/hooks/partyRoom'
export const useRemove = () => {
  const { send } = useRoom()
  return { remove: (payload: string) => send({ type: 'remove', id: payload }) }
}
