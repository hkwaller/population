'use client'

import { useState } from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { motion } from 'motion/react'
import { Keyboard, Check } from 'lucide-react'
import { POP } from './theme'
import { formatCompactNumber } from '@/lib/utils'

/**
 * Confidence-mode slider: one track, two thumbs, and the guess *is* the band.
 * The player drags the edges; the answer is the band's midpoint and the
 * confidence half-width is how far the edges sit from it. Replaces the old
 * "value slider + separate width slider" stack, which asked the same question
 * twice.
 */
export function PopRangeSlider({
  min,
  max,
  center,
  band,
  onChange,
  valueColor = POP.cobalt,
  locked = false,
  onOpenKeypad,
  compact = false,
  unit,
}: {
  min: number
  max: number
  /** Midpoint of the band - this is the submitted answer. */
  center: number
  /** Half-width of the band - this is the submitted confidence. */
  band: number
  onChange: (center: number, band: number) => void
  valueColor?: string
  locked?: boolean
  onOpenKeypad?: () => void
  compact?: boolean
  unit?: string
}) {
  const [dragging, setDragging] = useState(false)

  if (isNaN(center) || isNaN(band)) return null

  const lo = Math.max(min, center - band)
  const hi = Math.min(max, center + band)

  const fill = locked ? POP.mint : POP.sunshine
  // Big ranges (populations, areas) get compact labels - "55M" not "55000000".
  const fmt = (v: number) => (max >= 1_000_000 ? formatCompactNumber(v) : v.toString())

  // Re-derive center/band from the dragged edges, anchoring the edge the player
  // *didn't* touch so it doesn't drift out from under their finger on odd widths.
  const handleValues = ([nextLo, nextHi]: number[]) => {
    const l = Math.round(nextLo)
    const h = Math.round(nextHi)
    const nextBand = Math.round((h - l) / 2)
    const movedLo = l !== lo
    onChange(movedLo ? h - nextBand : l + nextBand, nextBand)
  }

  return (
    <div
      className={`mx-auto w-full rounded-pill bg-white/15 ${
        compact ? 'px-4 py-3' : 'px-6 py-4'
      } ${locked ? 'pointer-events-none opacity-60' : ''}`}
    >
      {/* The readout lives above the track - two value pills riding the thumbs
          would collide as soon as the band gets narrow. */}
      <div className="flex items-center justify-center gap-2">
        <motion.div
          animate={{ scale: dragging && !locked ? 1.04 : 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="flex items-center gap-2 rounded-pill bg-white px-4 py-1.5"
          style={{ boxShadow: dragging ? '0 6px 0 rgba(0,0,0,0.22)' : '0 4px 0 rgba(0,0,0,0.16)' }}
        >
          <span
            className={`font-black leading-none ${compact ? 'text-xl' : 'text-[28px]'}`}
            style={{ color: locked ? POP.ink : valueColor }}
          >
            {fmt(lo)}
          </span>
          <span
            className={`font-black leading-none ${compact ? 'text-lg' : 'text-2xl'}`}
            style={{ color: POP.ink, opacity: 0.35 }}
          >
            –
          </span>
          <span
            className={`font-black leading-none ${compact ? 'text-xl' : 'text-[28px]'}`}
            style={{ color: locked ? POP.ink : valueColor }}
          >
            {fmt(hi)}
          </span>
          {locked && <Check size={compact ? 20 : 26} strokeWidth={3.5} color={POP.mint} />}
        </motion.div>
      </div>

      <div className="mt-2.5 flex items-center gap-3 md:gap-4">
        <span className="shrink-0 text-base font-extrabold text-white/70 md:text-lg">
          {fmt(min)}
        </span>

        <SliderPrimitive.Root
          min={min}
          max={max}
          step={Math.max(1, Math.round((max - min) / 1000))}
          value={[lo, hi]}
          onValueChange={handleValues}
          onPointerDown={() => setDragging(true)}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
          minStepsBetweenThumbs={0}
          className="relative flex flex-1 touch-none select-none items-center"
        >
          <SliderPrimitive.Track
            className={`relative grow rounded-pill bg-white/25 ${compact ? 'h-5' : 'h-7'}`}
          >
            <SliderPrimitive.Range
              className="absolute h-full rounded-pill"
              style={{ background: fill }}
            />
          </SliderPrimitive.Track>

          <RangeThumb label="Low edge" compact={compact} dragging={dragging && !locked} />
          <RangeThumb label="High edge" compact={compact} dragging={dragging && !locked} />
        </SliderPrimitive.Root>

        <span className="shrink-0 text-base font-extrabold text-white/70 md:text-lg">
          {fmt(max)}
        </span>
      </div>

      <p className="mt-2 text-balance text-center text-xs font-bold text-white/60">
        ± {fmt(band)}
        {unit ? ` ${unit}` : ''} · tighter = more points
      </p>

      {onOpenKeypad && !locked && (
        <button
          onClick={onOpenKeypad}
          className="mx-auto mt-2 flex items-center gap-1.5 rounded-pill bg-white/20 px-4 py-1.5 text-sm font-bold text-white/90"
        >
          <Keyboard size={16} /> Type exact number
        </button>
      )}
    </div>
  )
}

/** A grabbable white puck. Both edges look identical - neither is "the answer". */
function RangeThumb({
  label,
  compact,
  dragging,
}: {
  label: string
  compact: boolean
  dragging: boolean
}) {
  return (
    <SliderPrimitive.Thumb className="block focus:outline-none" aria-label={label}>
      <motion.div
        animate={{ scale: dragging ? 1.12 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={`flex items-center justify-center gap-[3px] rounded-pill bg-white ${
          compact ? 'h-8 w-8' : 'h-10 w-10'
        }`}
        style={{ boxShadow: '0 4px 0 rgba(0,0,0,0.2)' }}
      >
        <span className="h-3 w-[2px] rounded-pill" style={{ background: POP.ink, opacity: 0.3 }} />
        <span className="h-3 w-[2px] rounded-pill" style={{ background: POP.ink, opacity: 0.3 }} />
      </motion.div>
    </SliderPrimitive.Thumb>
  )
}
