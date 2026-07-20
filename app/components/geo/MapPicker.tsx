'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Maximize2, X } from 'lucide-react'

import type { LatLng } from '@/app/types'
import { PopButton } from '../pop/PopButton'
import { POP } from '../pop/theme'
import { WorldMap } from './WorldMap'

/**
 * Map answering UI. The inline map is too small to aim on, so it's a
 * tap-anywhere launcher (a static preview of your current pin) that opens a
 * fullscreen overlay - that overlay is where you pan/zoom/tap to drop the pin
 * and confirm. Rotating a phone into landscape also opens it, but that's only a
 * bonus: most people play with rotation lock on, so the OS never reports
 * landscape and the tap target is the path that always works. The pin is shared
 * between the preview and the fullscreen view.
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

  // Phones only: landscape opens the fullscreen map. We open both when the
  // question already loads in landscape and when the device rotates into it.
  // NOTE: with rotation lock on (the common case) the OS never enters landscape,
  // so this never fires - that's why the tap-to-open target below is the primary
  // path and this is only a shortcut for people who play unlocked. Firing on the
  // change (not on every render) means closing it while still landscape won't
  // immediately reopen. Desktops (fine pointer) are excluded.
  useEffect(() => {
    if (disabled) return
    if (typeof window === 'undefined' || !window.matchMedia) return
    const isPhone = window.matchMedia('(max-width: 900px) and (pointer: coarse)').matches
    if (!isPhone) return
    const landscape = window.matchMedia('(orientation: landscape)')
    if (landscape.matches) setExpanded(true)
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
      {/* The inline map is a launcher, not an aiming surface - the whole card
          opens the fullscreen map where you actually place the pin. It shows a
          static preview of the current guess (pointer-events off so every tap
          reaches the button). */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setExpanded(true)}
        aria-label={value ? 'Open the map to adjust your guess' : 'Open the map to place your guess'}
        className="relative block w-full overflow-hidden rounded-[24px] border-4 border-pop-ink shadow-pop-card disabled:opacity-60"
      >
        <div className="pointer-events-none">
          <WorldMap value={value} interactive={false} />
        </div>
        {!disabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-pop-ink/15">
            <span className="flex items-center gap-2 rounded-pill border-2 border-pop-ink bg-white px-4 py-2 text-sm font-black text-pop-ink shadow-pop-sm">
              <Maximize2 size={16} />
              {value ? 'Tap to adjust your guess' : 'Tap to open the map'}
            </span>
          </div>
        )}
      </button>
      <PopButton variant="primary" size="lg" disabled={disabled || !value} onClick={onConfirm}>
        {value ? 'Lock it in' : 'Tap to open the map'}
      </PopButton>
      {overlay}
    </div>
  )
}
