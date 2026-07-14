import { useState } from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { motion } from 'motion/react'

const Slider = ({
  min,
  max,
  value,
  onChange,
  defaultHidden = false,
  openManualModal,
  small = false,
}: {
  min: number
  max: number
  value: number
  onChange: (value: number) => void
  defaultHidden?: boolean
  openManualModal?: () => void
  small?: boolean
}) => {
  const handleSliderChange = (value: number[]) => {
    onChange(Math.round(value[0]))
  }

  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null)

  // Track drag direction by comparing to the previous value during render
  // (the React-recommended alternative to adjusting state in an effect).
  const [prevValue, setPrevValue] = useState(value)
  if (value !== prevValue) {
    setDragDirection(value > prevValue ? 'right' : 'left')
    setPrevValue(value)
  }

  if (isNaN(value)) {
    return null
  }

  const buttonVariants = {
    hidden: { opacity: 0, translateX: 200 },
    visible: { opacity: 1, translateX: 0 },
  }

  return (
    <div
      className={`bg-ish-mint border-8 border-ish-ink ${
        small ? 'p-4' : 'p-6'
      } transform -rotate-1 max-w-[400px] mx-auto w-full`}
    >
      <div className="flex justify-between text-xl font-bold mb-6 mx-auto">
        <motion.div className="relative pt-3" whileHover="visible" initial="hidden">
          <span
            className="text-md break-words text-left cursor-pointer"
            onClick={() => onChange(Math.max(min, value - 1))}
          >
            {min}
          </span>
          <motion.span
            className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-white border-2 border-ish-ink rounded-full w-6 h-6 flex items-center justify-center"
            variants={buttonVariants}
            transition={{ duration: 0.2 }}
          >
            -
          </motion.span>
        </motion.div>
        <motion.span
          layout
          className="cursor-pointer text-2xl text-ish-coral bg-white px-3 py-1 border-4 border-ish-ink transform -rotate-2 text-wrap break-words text-center font-extrabold"
          onClick={openManualModal}
        >
          {value}
        </motion.span>
        <span
          className="text-md pt-3 break-words text-right cursor-pointer"
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          {max}
        </span>
      </div>
      <SliderPrimitive.Root
        min={min}
        max={max}
        step={(max - min) / 1000}
        value={[value]}
        onValueChange={(v) => handleSliderChange(v)}
        className="relative flex items-center select-none touch-none w-full pb-4"
      >
        <SliderPrimitive.Track
          className={`bg-ish-ink relative grow rounded-full ${small ? 'h-2' : 'h-6'}`}
        >
          <SliderPrimitive.Range className="absolute bg-ish-violet rounded-full h-full" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className={`block ${
            small ? 'w-8 h-8' : 'w-16 h-16'
          } bg-white border-4 border-ish-ink shadow-lg rounded-full focus:outline-none`}
        ></SliderPrimitive.Thumb>
      </SliderPrimitive.Root>
    </div>
  )
}

export default Slider
