import { useSyncExternalStore } from 'react'

const emptySubscribe = () => () => {}

/**
 * Returns `false` during SSR and the first client render, then `true` once
 * hydrated. Use to gate client-only or non-deterministic UI (random content,
 * localStorage-dependent output) without a `setState`-in-effect mount flag.
 *
 * This is the hydration-safe replacement for the
 * `useState(false)` + `useEffect(() => setMounted(true), [])` pattern.
 */
export function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true, // client snapshot
    () => false, // server snapshot
  )
}
