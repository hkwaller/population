'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Maximize2, X } from 'lucide-react'

import type { LatLng } from '@/app/types'
import { PopButton } from '../pop/PopButton'
import { POP } from '../pop/theme'
import { WorldMap } from './WorldMap'

/** Opens each map question directly in the fullscreen answering surface.
 * Closing returns to the inline preview, which can reopen the same guess.
 */
export function MapPicker({
  question,
  value,
  onPick,
  onConfirm,
  disabled = false,
}: {
  question: string
  value: LatLng | null
  onPick: (p: LatLng) => void
  onConfirm: () => void
  disabled?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  const titleId = useId()

  // Open after hydration. A parent's question key starts a fresh picker for each
  // round; ordinary pin updates and closing the dialog do not reopen it.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fullscreen portal opens after hydration and follows answer availability
    setExpanded(!disabled)
  }, [disabled])

  // Lock body scroll while the overlay is open.
  useEffect(() => {
    if (!expanded) return
    const prev = document.body.style.overflow
    const previousFocus = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    const dialog = dialogRef.current
    dialog?.querySelector<HTMLButtonElement>('button')?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(false)
      if (event.key !== 'Tab' || !dialog) return
      const controls = Array.from(dialog.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [tabindex="0"]',
      ))
      const first = controls[0]
      const last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prev
      previousFocus?.focus()
    }
  }, [expanded])

  const overlay =
    expanded && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="fixed inset-0 z-[60] flex min-h-0 flex-col overflow-hidden"
            style={{
              background: POP.paper,
              paddingTop: 'var(--safe-top, env(safe-area-inset-top, 0px))',
              paddingLeft: 'env(safe-area-inset-left, 0px)',
              paddingRight: 'env(safe-area-inset-right, 0px)',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-2">
              <h2 id={titleId} className="min-w-0 text-base font-black leading-snug text-pop-ink sm:text-lg">
                {question}
              </h2>
              <button
                type="button"
                aria-label="Close fullscreen map"
                onClick={() => setExpanded(false)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-pop-ink bg-white text-pop-ink shadow-pop-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pop-ink"
              >
                <X size={22} />
              </button>
            </div>

            <div className="min-h-0 flex-1">
              <WorldMap value={value} onPick={onPick} interactive={!disabled} fill />
            </div>

            <div className="flex shrink-0 flex-col gap-2 px-4 pb-3 pt-2">
              <p className="text-center text-xs font-bold text-pop-ink/80">
                Tap to place · Drag to pan · Pinch or scroll to zoom
                <span className="hidden sm:inline"> · Space + drag to pan</span>
              </p>
              <PopButton
                variant="primary"
                size="md"
                disabled={disabled || !value}
                onClick={() => {
                  if (!value) return
                  setExpanded(false)
                  onConfirm()
                }}
              >
                {value ? 'Lock it in' : 'Place a pin to continue'}
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
        aria-label={
          value ? 'Open the map to adjust your guess' : 'Open the map to place your guess'
        }
        className="relative block w-full overflow-hidden rounded-card border-4 border-pop-ink shadow-pop-card disabled:opacity-60"
      >
        <div className="pointer-events-none">
          <WorldMap value={value} interactive={false} showControls={false} />
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
