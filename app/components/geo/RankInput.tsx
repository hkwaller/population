'use client'

import { useEffect, useRef, useState } from 'react'
import { Reorder } from 'motion/react'
import { GripVertical } from 'lucide-react'

import type { RankQuestion } from '@/app/types'
import { PopButton } from '../pop/PopButton'
import { POP } from '../pop/theme'

/**
 * Controlled drag-to-reorder list for a rank question (top = position 1). Dumb:
 * the parent owns the order and supplies the commit control. Used directly by the
 * multiplayer game, where "Lock" lives in the host Dock rather than under the list.
 * `tone` sets the helper-text colour ('light' on dark backgrounds, 'dark' on cards).
 */
export function RankList({
  order,
  onReorder,
  disabled = false,
  tone = 'dark',
}: {
  order: string[]
  onReorder: (order: string[]) => void
  disabled?: boolean
  tone?: 'light' | 'dark'
}) {
  return (
    <div className="flex w-full flex-col gap-4">
      <p
        className={`text-center text-base font-bold ${
          tone === 'light' ? 'text-white/80' : 'text-pop-ink/60'
        }`}
      >
        Drag into order - most populous at the top
      </p>
      <Reorder.Group
        axis="y"
        values={order}
        onReorder={onReorder}
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
 * Self-contained rank input: manages its own order + answer timer and commits with
 * "Lock it in". Used by the shared per-type input (solo/daily) and the same-device
 * game page. Resets when the question changes.
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

  // Reset the order when the question changes (pure derived-state during render).
  const [prevId, setPrevId] = useState(question.id)
  if (question.id !== prevId) {
    setPrevId(question.id)
    setOrder(question.items.map((i) => i.label))
  }

  // Start the answer timer on mount and whenever the question changes.
  useEffect(() => {
    startedAt.current = performance.now()
  }, [question.id])

  return (
    <div className="flex flex-col gap-4">
      <RankList order={order} onReorder={setOrder} disabled={disabled} />
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
