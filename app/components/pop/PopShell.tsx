'use client'

import { useEffect } from 'react'

import { PopChips } from './PopChips'
import { cn } from '@/lib/utils'
import { statusBarFor } from '@/lib/native'

// Full-bleed colored shell with the signature left→right wipe on entry.
// Each route passes its own background color (see ROUTE_BG in theme.ts).
export function PopShell({
  bg,
  children,
  chips = false,
  chipsOpacity = 0.5,
  className,
}: {
  bg: string
  children: React.ReactNode
  chips?: boolean
  chipsOpacity?: number
  className?: string
}) {
  // Native app: status bar text that reads on this route's colour (no-op on the web).
  useEffect(() => statusBarFor(bg), [bg])

  return (
    // paddingTop keeps content below the native status bar; 0 in a browser.
    <div
      className="pop-wipe fixed inset-0 overflow-hidden"
      style={{ backgroundColor: bg, paddingTop: 'var(--safe-top)' }}
    >
      {chips && <PopChips opacity={chipsOpacity} />}
      <div className={cn('pop-scroll relative z-10 h-full w-full overflow-y-auto', className)}>
        {children}
      </div>
    </div>
  )
}
