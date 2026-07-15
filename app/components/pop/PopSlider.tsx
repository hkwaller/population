'use client'

import { useState } from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { motion } from 'motion/react'
import { Keyboard, Check } from 'lucide-react'
import { POP } from './theme'
import { formatCompactNumber } from '@/lib/utils'

// The core Sticker Pop slider: pill container, sunshine fill, white value-pill thumb.
export function PopSlider({
  min,
  max,
  value,
  onChange,
  valueColor = POP.cobalt,
  locked = false,
  onOpenKeypad,
  compact = false,
}: {
  min: number
  max: number
  value: number
  onChange: (v: number) => void
  valueColor?: string
  locked?: boolean
  onOpenKeypad?: () => void
  compact?: boolean
}) {
  const [dragging, setDragging] = useState(false)

  if (isNaN(value)) return null

  const fill = locked ? POP.mint : POP.sunshine
  // Big ranges (populations, areas) get compact labels - "55M" not "55000000".
  // Small ranges (years, percentages) stay exact.
  const fmt = (v: number) => (max >= 1_000_000 ? formatCompactNumber(v) : v.toString())
  // Nudge by ~1% of the range so the buttons do something on huge ranges.
  const nudge = Math.max(1, Math.round((max - min) / 100))

  return (
    <div
      className={`mx-auto w-full rounded-pill bg-white/15 ${
        compact ? 'px-4 py-3' : 'px-8 py-5'
      } ${locked ? 'pointer-events-none opacity-60' : ''}`}
    >
      <div className="flex items-center gap-3 md:gap-4">
        <button
          className="shrink-0 text-lg font-extrabold text-white/90 md:text-xl"
          onClick={() => onChange(Math.max(min, value - nudge))}
          aria-label="Nudge down"
        >
          {fmt(min)}
        </button>

        <SliderPrimitive.Root
          min={min}
          max={max}
          step={(max - min) / 1000}
          value={[value]}
          onValueChange={(v) => onChange(Math.round(v[0]))}
          onPointerDown={() => setDragging(true)}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
          className="relative flex flex-1 touch-none select-none items-center"
        >
          <SliderPrimitive.Track
            className={`relative grow rounded-pill bg-white/30 ${compact ? 'h-5' : 'h-7'}`}
          >
            <SliderPrimitive.Range
              className="absolute h-full rounded-pill"
              style={{ background: fill }}
            />
          </SliderPrimitive.Track>

          <SliderPrimitive.Thumb className="block focus:outline-none" aria-label="Guess">
            <motion.div
              animate={
                dragging && !locked
                  ? { rotate: [0, 8, -8, 0], scale: 1.08 }
                  : { rotate: 0, scale: 1 }
              }
              transition={
                dragging && !locked
                  ? { rotate: { repeat: Infinity, duration: 0.4 }, scale: { duration: 0.15 } }
                  : { type: 'spring', stiffness: 300, damping: 20 }
              }
              className="flex items-center gap-1.5 rounded-pill bg-white px-3 py-1.5"
              style={{
                boxShadow: dragging ? '0 8px 0 rgba(0,0,0,0.25)' : '0 5px 0 rgba(0,0,0,0.18)',
              }}
            >
              <span
                className={`font-black leading-none ${compact ? 'text-2xl' : 'text-[34px]'}`}
                style={{ color: locked ? POP.ink : valueColor }}
              >
                {fmt(value)}
              </span>
              {locked && <Check size={compact ? 22 : 30} strokeWidth={3.5} color={POP.mint} />}
            </motion.div>
          </SliderPrimitive.Thumb>
        </SliderPrimitive.Root>

        <button
          className="shrink-0 text-lg font-extrabold text-white/90 md:text-xl"
          onClick={() => onChange(Math.min(max, value + nudge))}
          aria-label="Nudge up"
        >
          {fmt(max)}
        </button>
      </div>

      {/* Keypad affordance lives below the track now - it used to crowd the thumb. */}
      {onOpenKeypad && !locked && (
        <button
          onClick={onOpenKeypad}
          className="mx-auto mt-3 flex items-center gap-1.5 rounded-pill bg-white/20 px-4 py-1.5 text-sm font-bold text-white/90"
        >
          <Keyboard size={16} /> Type exact number
        </button>
      )}
    </div>
  )
}
