'use client'

import { PopSlider } from '../pop/PopSlider'
import { POP } from '../pop/theme'

/**
 * Confidence-mode radius picker for map questions: how wide the circle around
 * the pin is. A tight circle that's right scores big; a wide one scores little.
 * Slider questions don't use this - there the band IS the input, see
 * PopRangeSlider.
 */
export function ConfidenceBand({
  label,
  min,
  max,
  value,
  onChange,
  disabled = false,
}: {
  label: string
  min: number
  max: number
  value: number
  onChange: (v: number) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-center text-xs font-bold text-white/60">{label}</span>
      <PopSlider
        min={min}
        max={max}
        value={value}
        onChange={onChange}
        valueColor={POP.coral}
        locked={disabled}
        compact
      />
    </div>
  )
}
