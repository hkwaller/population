import { useRouter } from 'next/navigation'
import { usePopStore } from '../state'
import { Button } from '@/components/ui/button'

export const Reconnect = () => {
  const router = useRouter()
  const { me, gameId } = usePopStore()

  return (
    <div className="py-8 mx-auto w-full flex items-center justify-center">
      <Button
        size="lg"
        className={`
          bg-ish-coral text-white font-extrabold group py-6 px-14 text-2xl uppercase border-8 border-ish-ink transform rotate-1 transition-all duration-200 hover:scale-105 hover:opacity-90
        `}
        onClick={() => {
          router.push(`/game/${gameId}/${me?.id}`)
        }}
      >
        Reconnect
      </Button>
    </div>
  )
}
