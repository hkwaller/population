'use client'

import { memo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Reorder } from 'motion/react'
import { GripVertical } from 'lucide-react'

import type { RankQuestion } from '@/app/types'
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll'
import { PopButton } from '../pop/PopButton'
import { POP } from '../pop/theme'

/**
 * Full-screen rank input for live games. Rebuilt (from the old inline RankList) to
 * kill the "tile snaps back a few pixels into a drag" bug for good:
 *
 *  - Portalled to <body>, so there is NO scrollable and NO CSS-transformed
 *    ancestor. A scroll container competes with the drag for the touch gesture
 *    (browser claims it as a pan → pointercancel → snap-back); a transformed
 *    ancestor breaks `position: fixed` and Framer's drag math. The portal escapes
 *    both (the game pages sit inside animated/transformed shells).
 *  - `touch-action: none` on the surface, the group, and every item so the
 *    browser never interprets the drag start as a scroll.
 *  - Owns its order as local state and only reports it on Lock, and is memoised on
 *    question id, so the Liveblocks-driven page re-rendering never reaches the
 *    list mid-gesture.
 *
 * Order is always presented most-populous-first (see toLargestFirstRank).
 */
function RankModalInner({
  question,
  onLock,
}: {
  question: RankQuestion
  /** Commit the final order. The modal disables itself and waits to unmount. */
  onLock: (order: string[]) => void
}) {
  const [order, setOrder] = useState<string[]>(() => question.items.map((i) => i.label))
  const [locking, setLocking] = useState(false)
  useLockBodyScroll(true)

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex flex-col overflow-hidden"
      style={{ background: POP.cobalt, touchAction: 'none' }}
    >
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-7 px-5 py-8">
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/60">
            Drag to sort
          </p>
          <h2 className="mt-2 text-balance text-2xl font-black leading-tight text-white">
            {question.question}
          </h2>
          <p className="mt-1.5 text-sm font-bold text-white/70">Most populous at the top</p>
        </div>

        <Reorder.Group
          axis="y"
          values={order}
          onReorder={setOrder}
          className="flex flex-col gap-3"
          style={{ touchAction: 'none' }}
        >
          {order.map((label, i) => (
            <Reorder.Item
              key={label}
              value={label}
              whileDrag={{ scale: 1.04, boxShadow: '0 12px 0 rgba(0,0,0,0.22)' }}
              className="flex cursor-grab touch-none select-none items-center gap-3 rounded-pill border-4 border-pop-ink bg-white px-4 py-4 shadow-pop-btn active:cursor-grabbing"
              style={{ touchAction: 'none' }}
            >
              <span
                className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-lg font-black text-white"
                style={{ background: POP.ink }}
              >
                {i + 1}
              </span>
              <span className="text-lg font-black leading-tight text-pop-ink">{label}</span>
              <GripVertical size={24} className="ml-auto flex-none text-pop-ink/35" />
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>

      <div className="px-5 pb-8 pt-2">
        <PopButton
          variant="secondary"
          size="lg"
          rotate={-1}
          className="mx-auto w-full max-w-md"
          disabled={locking}
          onClick={() => {
            setLocking(true)
            onLock(order)
          }}
        >
          {locking ? 'Locked!' : 'Lock it in'}
        </PopButton>
      </div>
    </div>,
    document.body,
  )
}

/**
 * Memoised on question id: parent (game page) re-renders from Liveblocks must not
 * re-render the modal mid-drag. `onLock` is intentionally ignored - it closes over
 * values that are stable for the lifetime of a question.
 */
export const RankModal = memo(RankModalInner, (p, n) => p.question.id === n.question.id)
