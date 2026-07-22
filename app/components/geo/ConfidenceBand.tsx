'use client'

import { PopSlider } from '../pop/PopSlider'
import { POP } from '../pop/theme'

/**
 * Secondary slider shown in confidence mode: the player sets how wide their band
 * (slider ± band) or circle (map radius) is. A narrow band that's right scores big;
 * a wide one scores little. Rendered under the primary value input.
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
    <div className="flex flex-col gap-2 rounded-3xl border-2 border-dashed border-pop-ink/30 p-3">
      <span className="text-center text-sm font-black uppercase tracking-wide text-pop-ink/50">
        {label}
      </span>
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
