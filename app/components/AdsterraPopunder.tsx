'use client'

import { useEffect, useRef } from 'react'

import { useAdFree } from '@/hooks/useAdFree'
import { ADSTERRA_POPUNDER_SRC as POPUNDER_SRC } from '@/lib/ads'

/**
 * How long to wait, per device, before we re-inject the popunder script.
 * The injected Adsterra `invoke.js` installs a document-wide click handler that
 * can open a popunder on *every* qualifying click, so re-arming it on each end
 * screen (new game, rematch, refresh) makes the game feel spammy. We cap loads
 * to once per this window. This is a client-side backstop - the authoritative
 * per-impression cap must still be set on the Adsterra popunder unit itself.
 */
const POPUNDER_COOLDOWN_MS = 24 * 60 * 60 * 1000 // 24h
const POPUNDER_LS_KEY = 'pop:popunder:lastFiredAt'

function withinCooldown(): boolean {
  try {
    const raw = window.localStorage.getItem(POPUNDER_LS_KEY)
    if (!raw) return false
    const last = Number(raw)
    if (!Number.isFinite(last)) return false
    return Date.now() - last < POPUNDER_COOLDOWN_MS
  } catch {
    return false
  }
}

/**
 * Adsterra popunder, fired at most once per cooldown window. Self-gating: never
 * injected for ad-free users (or before Clerk hydrates). Mount this only where a
 * popunder is acceptable - e.g. the end-of-game screen on player devices.
 */
export function AdsterraPopunder() {
  const { adFree, loading } = useAdFree()
  const fired = useRef(false)

  useEffect(() => {
    if (adFree || loading || fired.current || !POPUNDER_SRC) return
    if (withinCooldown()) return
    fired.current = true

    try {
      window.localStorage.setItem(POPUNDER_LS_KEY, String(Date.now()))
    } catch {
      // localStorage unavailable (private mode / blocked) - still fire once
      // this mount; the in-memory `fired` ref prevents duplicate injection.
    }

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = POPUNDER_SRC
    document.body.appendChild(script)
  }, [adFree, loading])

  return null
}
