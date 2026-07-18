'use client'

import { motion } from 'motion/react'
import { RefreshCw, SkipForward, ListEnd, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { POP } from './theme'

// Host-only floating control dock. Pinned to the bottom on its own layer so
// tall question content (WorldMap, choice lists) can never push it off-screen -
// the problem the old inline control row had. Sits *below* the reveal modal
// (z-40 vs the modal's z-50) so the modal keeps its own CTA during the reveal.
export function Dock({
  onReplace,
  onNext,
  onEnd,
  onLock,
  showLock = false,
  lockDisabled = false,
  canEndGame = false,
  ending = false,
}: {
  onReplace: () => void
  onNext: () => void
  onEnd?: () => void
  onLock?: () => void
  // When the host still owes an answer on a rank question, the primary CTA is
  // Lock (their own answer), so Next/End step back to the subtle tone.
  showLock?: boolean
  lockDisabled?: boolean
  canEndGame?: boolean
  ending?: boolean
}) {
  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-4"
    >
      <div className="pointer-events-auto flex items-center gap-2 rounded-pill border-[3px] border-white bg-pop-ink/95 p-2 shadow-pop-card backdrop-blur">
        <DockButton onClick={onReplace} label="Replace" tone="subtle">
          <RefreshCw size={18} strokeWidth={2.75} />
        </DockButton>
        {canEndGame ? (
          <DockButton
            onClick={() => onEnd?.()}
            label={ending ? 'Ending…' : 'End game'}
            tone={showLock ? 'subtle' : 'primary'}
            disabled={ending}
          >
            <ListEnd size={18} strokeWidth={2.75} />
          </DockButton>
        ) : (
          <DockButton onClick={onNext} label="Next" tone={showLock ? 'subtle' : 'primary'}>
            <SkipForward size={18} strokeWidth={2.75} />
          </DockButton>
        )}
        {showLock && (
          <DockButton
            onClick={() => onLock?.()}
            label="Lock"
            tone="primary"
            disabled={lockDisabled}
          >
            <Lock size={18} strokeWidth={2.75} />
          </DockButton>
        )}
      </div>
    </motion.div>
  )
}

export function DockButton({
  children,
  label,
  onClick,
  tone,
  disabled = false,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  tone: 'primary' | 'subtle'
  disabled?: boolean
}) {
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.92 }}
      onClick={() => {
        if (disabled) return
        onClick()
      }}
      aria-label={label}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill px-4 py-2.5 text-base font-black tracking-tight transition-colors',
        disabled && 'opacity-60',
        tone === 'primary' ? 'text-pop-ink' : 'bg-white/15 text-white',
      )}
      style={tone === 'primary' ? { background: POP.sunshine } : undefined}
    >
      {children}
      <span>{label}</span>
    </motion.button>
  )
}
