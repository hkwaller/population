/**
 * The offline island has no router: `next/link` (shims/next-link.tsx) calls
 * this, and OfflineApp listens. Every in-game link points at "/", which here
 * means the offline home.
 */
type Listener = (href: string) => void

let listener: Listener = () => {}

export function onNavigate(cb: Listener) {
  listener = cb
}

export function navigate(href: string) {
  listener(href)
}
