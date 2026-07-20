import { useEffect } from 'react'

/**
 * Locks page scroll while `active`. Used by drag-to-reorder inputs (rank
 * questions): on touch the browser can interpret the start of a drag as a page
 * scroll and hijack the gesture, which "drops" the tile mid-drag. Removing the
 * scroll competition keeps the drag smooth. Restores the previous value on
 * cleanup so nested locks (e.g. a modal over the list) don't clobber each other.
 */
export function useLockBodyScroll(active: boolean) {
  useEffect(() => {
    if (!active || typeof document === 'undefined') return
    const body = document.body
    const prevOverflow = body.style.overflow
    const prevOverscroll = body.style.overscrollBehavior
    body.style.overflow = 'hidden'
    body.style.overscrollBehavior = 'none'
    return () => {
      body.style.overflow = prevOverflow
      body.style.overscrollBehavior = prevOverscroll
    }
  }, [active])
}
