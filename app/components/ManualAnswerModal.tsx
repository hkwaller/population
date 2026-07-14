import { SkipBack, SkipForward } from 'lucide-react'
import Button from './Button'
import { SpringModal } from './SpringModal'
import { usePopStore } from '../state'
import { asSlider } from '@/lib/utils'

export function ManualAnswerModal({
  isVisible,
  setIsVisible,
  currentAnswer,
  setCurrentAnswer,
}: {
  isVisible: boolean
  setIsVisible: (isVisible: boolean) => void
  currentAnswer: number
  setCurrentAnswer: (currentAnswer: number) => void
}) {
  const { currentQuestion } = usePopStore()
  const slider = asSlider(currentQuestion)

  return (
    <SpringModal
      isOpen={isVisible}
      setIsOpen={() => {
        setIsVisible(!isVisible)
      }}
      onClose={() => {
        setIsVisible(!isVisible)
      }}
    >
      <div className="flex flex-col align-center">
        <div className="font-bold mb-4">What is your answer?</div>
        <input
          className="input autofocus p-4"
          type="number"
          min={slider?.lower_bound}
          max={slider?.upper_bound}
          value={currentAnswer}
          onChange={(e) => setCurrentAnswer(parseInt(e.target.value, 10))}
        />
        <div className="flex gap-2 mt-4 justify-around">
          <Button small bg="bg-red" onClick={() => setCurrentAnswer(currentAnswer - 1)}>
            <SkipBack />
          </Button>
          <Button small bg="bg-red" onClick={() => setCurrentAnswer(currentAnswer + 1)}>
            <SkipForward />
          </Button>
        </div>
        <Button className="mt-4 mx-auto" onClick={() => setIsVisible(false)}>
          Done
        </Button>
      </div>
    </SpringModal>
  )
}
