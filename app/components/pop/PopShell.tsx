'use client'

import { PopChips } from './PopChips'
import { cn } from '@/lib/utils'

// Full-bleed colored shell with the signature left→right wipe on entry.
// Each route passes its own background color (see ROUTE_BG in theme.ts).
export function PopShell({
  bg,
  children,
  chips = false,
  chipsOpacity = 1,
  className,
}: {
  bg: string
  children: React.ReactNode
  chips?: boolean
  chipsOpacity?: number
  className?: string
}) {
  return (
    <div className="pop-wipe fixed inset-0 overflow-hidden" style={{ backgroundColor: bg }}>
      {chips && <PopChips opacity={chipsOpacity} />}
      <div className={cn('pop-scroll relative z-10 h-full w-full overflow-y-auto', className)}>
        {children}
      </div>
    </div>
  )
}
