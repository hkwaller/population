'use client'

import { memo, useEffect, useRef, useState } from 'react'
import { Reorder } from 'motion/react'
import { GripVertical } from 'lucide-react'

import type { RankItem, RankQuestion } from '@/app/types'
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll'
import { PopButton } from '../pop/PopButton'
import { POP } from '../pop/theme'

/**
 * Drag-to-reorder list for a rank question (top = position 1). Owns its order as
 * LOCAL state on purpose: the parent (a live game page) re-renders on every
 * Liveblocks update, and a *controlled* Reorder resets the drag mid-gesture when
 * new `values` arrive - the item snaps back. Local state keeps the drag smooth;
 * the current order is mirrored up via `onChange` for whatever commits it (the
 * Dock's Lock, or a standalone button). Re-inits when `resetKey` (the question id)
 * changes. `tone` sets the helper-text colour for dark vs light backgrounds.
 *
 * Wrapped in `memo` with a resetKey-based comparator: the live game pages that
 * host this list re-render constantly (Liveblocks presence/answers), and any of
 * those re-renders landing mid-drag would drop the gesture and snap the tile
 * back. We deliberately ignore `items`/`onChange` identity - `items` is only read
 * when `resetKey` changes (a new question) and `onChange` closes over a stable
 * ref/setter - so background parent renders can't disturb an in-flight drag.
 */
export const RankList = memo(
  RankListInner,
  (prev, next) =>
    prev.resetKey === next.resetKey &&
    prev.disabled === next.disabled &&
    prev.tone === next.tone,
)

function RankListInner({
  items,
  resetKey,
  onChange,
  disabled = false,
  tone = 'dark',
}: {
  items: RankItem[]
  resetKey: string
  onChange: (order: string[]) => void
  disabled?: boolean
  tone?: 'light' | 'dark'
}) {
  const [order, setOrder] = useState<string[]>(() => items.map((i) => i.label))

  // Lock page scroll while the list is interactive so a touch-drag can't be
  // hijacked as a page scroll and drop the tile mid-gesture. The list fits on
  // screen, so nothing is lost. Released once answered (disabled).
  useLockBodyScroll(!disabled)

  // Re-init on question change (pure derived-state during render).
  const [prevKey, setPrevKey] = useState(resetKey)
  if (resetKey !== prevKey) {
    setPrevKey(resetKey)
    setOrder(items.map((i) => i.label))
  }

  const handleReorder = (next: string[]) => {
    setOrder(next)
    onChange(next)
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <p
        className={`text-center text-base font-bold ${
          tone === 'light' ? 'text-white/80' : 'text-pop-ink/60'
        }`}
      >
        Drag into order — most populous at the top
      </p>
      <Reorder.Group
        axis="y"
        values={order}
        onReorder={handleReorder}
        className="flex flex-col gap-2.5"
      >
        {order.map((label, i) => (
          <Reorder.Item
            key={label}
            value={label}
            dragListener={!disabled}
            whileDrag={{ scale: 1.03, boxShadow: '0 10px 0 rgba(0,0,0,0.18)' }}
            className={`flex touch-none items-center gap-3 rounded-pill border-4 border-pop-ink bg-white px-4 py-3.5 shadow-pop-btn ${
              disabled ? '' : 'cursor-grab active:cursor-grabbing'
            }`}
          >
            <span
              className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-base font-black text-white"
              style={{ background: POP.ink }}
            >
              {i + 1}
            </span>
            <span className="text-lg font-black leading-tight text-pop-ink">{label}</span>
            <GripVertical size={22} className="ml-auto flex-none text-pop-ink/35" />
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  )
}

/**
 * Self-contained rank input: the drag list plus its own "Lock it in" button and
 * answer timer. Used by the shared per-type input (solo/daily). Live game pages
 * use RankList directly and commit through the Dock instead.
 */
export function RankInput({
  question,
  onAnswer,
  disabled = false,
}: {
  question: RankQuestion
  onAnswer: (value: string[], elapsedMs: number) => void
  disabled?: boolean
}) {
  const [order, setOrder] = useState<string[]>(() => question.items.map((i) => i.label))
  const startedAt = useRef<number>(0)

  // Keep the committed order in sync with the question (RankList resets its own
  // copy on the same key; this mirror is what the Lock button submits).
  const [prevId, setPrevId] = useState(question.id)
  if (question.id !== prevId) {
    setPrevId(question.id)
    setOrder(question.items.map((i) => i.label))
  }

  useEffect(() => {
    startedAt.current = performance.now()
  }, [question.id])

  return (
    <div className="flex flex-col gap-4">
      <RankList
        items={question.items}
        resetKey={question.id}
        onChange={setOrder}
        disabled={disabled}
      />
      <PopButton
        variant="primary"
        size="lg"
        disabled={disabled}
        onClick={() => onAnswer(order, Math.round(performance.now() - startedAt.current))}
      >
        Lock it in
      </PopButton>
    </div>
  )
}
