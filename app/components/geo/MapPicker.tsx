'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Maximize2, X } from 'lucide-react'

import type { LatLng } from '@/app/types'
import { PopButton } from '../pop/PopButton'
import { POP } from '../pop/theme'
import { WorldMap } from './WorldMap'

/**
 * Map answering UI. The inline map is small, so it offers two ways to get a
 * bigger canvas to aim on: an explicit "Expand" button, and — on phones —
 * auto-expanding to fullscreen when the device is rotated to landscape. Both
 * lead to the same fullscreen overlay where you pan/zoom/tap to drop a pin and
 * confirm. The pin is shared between the inline and fullscreen views.
 */
export function MapPicker({
  value,
  onPick,
  onConfirm,
  disabled = false,
}: {
  value: LatLng | null
  onPick: (p: LatLng) => void
  onConfirm: () => void
  disabled?: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  // Phones only: rotating into landscape opens the fullscreen map. Firing on the
  // change (not the current state) means closing it while still landscape won't
  // immediately reopen — you'd rotate again. Desktops (fine pointer) are excluded.
  useEffect(() => {
    if (disabled) return
    if (typeof window === 'undefined' || !window.matchMedia) return
    const isPhone = window.matchMedia('(max-width: 900px) and (pointer: coarse)').matches
    if (!isPhone) return
    const landscape = window.matchMedia('(orientation: landscape)')
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setExpanded(true)
    }
    landscape.addEventListener('change', onChange)
    return () => landscape.removeEventListener('change', onChange)
  }, [disabled])

  // Lock body scroll while the overlay is open.
  useEffect(() => {
    if (!expanded) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [expanded])

  const overlay =
    expanded && typeof document !== 'undefined'
      ? createPortal(
          <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: POP.paper }}>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="rounded-pill bg-pop-ink px-4 py-2 text-sm font-black text-white">
                {value ? 'Tap to adjust, then confirm' : 'Tap the map to guess'}
              </span>
              <button
                type="button"
                aria-label="Close fullscreen map"
                onClick={() => setExpanded(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-pop-ink bg-white text-pop-ink shadow-pop-sm"
              >
                <X size={22} />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 items-center justify-center px-3">
              <WorldMap value={value} onPick={onPick} interactive={!disabled} />
            </div>

            <div className="flex flex-col px-4 pb-6 pt-3">
              <PopButton
                variant="primary"
                size="lg"
                disabled={disabled || !value}
                onClick={() => {
                  if (!value) return
                  setExpanded(false)
                  onConfirm()
                }}
              >
                {value ? 'Lock it in' : 'Tap the map to guess'}
              </PopButton>
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <div className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-[24px] border-4 border-pop-ink shadow-pop-card">
        <WorldMap value={value} onPick={onPick} interactive={!disabled} />
        <button
          type="button"
          aria-label="Expand map"
          onClick={() => setExpanded(true)}
          className="absolute right-2 top-2 flex items-center gap-1.5 rounded-pill border-2 border-pop-ink bg-white px-3 py-2 text-sm font-black text-pop-ink shadow-pop-sm"
        >
          <Maximize2 size={16} /> Expand
        </button>
      </div>
      <PopButton variant="primary" size="lg" disabled={disabled || !value} onClick={onConfirm}>
        {value ? 'Lock it in' : 'Tap the map to guess'}
      </PopButton>
      {overlay}
    </div>
  )
}
