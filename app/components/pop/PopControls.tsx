'use client'

import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { POP } from './theme'

// iOS-style toggle pill. Coral when on, 20% ink when off.
export function PopToggle({
  checked,
  onChange,
  compact = false,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  compact?: boolean
}) {
  const w = compact ? 52 : 64
  const h = compact ? 30 : 38
  const knob = compact ? 24 : 30
  const pad = (h - knob) / 2

  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative shrink-0 rounded-pill transition-colors"
      style={{
        width: w,
        height: h,
        background: checked ? POP.coral : 'rgba(23,18,20,0.2)',
      }}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute rounded-full bg-white shadow-pop-sm"
        style={{
          width: knob,
          height: knob,
          top: pad,
          left: checked ? w - knob - pad : pad,
        }}
      />
    </button>
  )
}

// White pill text input, heavy weight, 4px ink focus ring.
export function PopInput({
  value,
  onChange,
  placeholder,
  maxLength,
  className,
  autoFocus,
  error = false,
  onKeyDown,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  maxLength?: number
  className?: string
  autoFocus?: boolean
  error?: boolean
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
}) {
  return (
    <input
      value={value}
      autoFocus={autoFocus}
      maxLength={maxLength}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className={cn(
        'w-full rounded-pill bg-white px-6 py-4 text-2xl font-extrabold text-pop-ink outline-none',
        'placeholder:text-[rgba(23,18,20,0.35)] focus:ring-4 focus:ring-pop-ink',
        error && 'ring-[5px] ring-pop-coral',
        className,
      )}
    />
  )
}
